<?php
// Métricas reales del negocio para el panel del administrador.
// GET ?periodo=hoy|7d|mes|30d (por defecto 7d). Todo sale de la tabla citas de SU barbería.
//
// Definiciones:
// - Citas: reservas del período que no se cancelaron.
// - Atendidas: citas COMPLETADAS. Ingresos = suma de su precio_total.
// - Por cobrar: citas CONFIRMADAS del período que aún no se atienden.
// - Clientes nuevos: clientes cuya primera cita (no cancelada) en la barbería cae en el período.
// - Cancelación: canceladas / todas las reservas del período.
//
// Las consultas evitan columnas sueltas fuera del GROUP BY para funcionar con
// ONLY_FULL_GROUP_BY (MySQL de Hostinger).

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

const PERIODOS = ['hoy', '7d', 'mes', '30d'];

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    $idBarberia = $usuario['id_barberia'];
    if (!$idBarberia) {
        responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
    }

    $periodo = (string) ($_GET['periodo'] ?? '7d');
    if (!in_array($periodo, PERIODOS, true)) {
        $periodo = '7d';
    }

    $ahora = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
    $hasta = $ahora;
    $desde = match ($periodo) {
        'hoy' => $ahora,
        '7d' => $ahora->modify('-6 days'),
        'mes' => $ahora->modify('first day of this month'),
        '30d' => $ahora->modify('-29 days'),
    };
    $desdeTxt = $desde->format('Y-m-d');
    $hastaTxt = $hasta->format('Y-m-d');

    // Mantenimiento: las citas confirmadas que ya terminaron (y no deben un pago en
    // línea) cuentan como atendidas. Si falla, las métricas se calculan igual.
    try {
        $pdo->prepare("
            UPDATE citas
            SET estado = 'COMPLETADA'
            WHERE id_barberia = ?
              AND estado = 'CONFIRMADA'
              AND NOT EXISTS (
                  SELECT 1 FROM wompi_pagos p
                  WHERE p.id_cita = citas.id_cita AND p.estado <> 'APPROVED'
              )
              AND CONCAT(fecha, ' ', hora_fin) <= ?
        ")->execute([$idBarberia, $ahora->format('Y-m-d H:i:s')]);
    } catch (Throwable $errorMantenimiento) {
        error_log('Métricas: no se pudo actualizar el estado de las citas: ' . $errorMantenimiento->getMessage());
    }

    // 1. Resumen del período.
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) AS reservas,
            COALESCE(SUM(estado <> 'CANCELADA'), 0) AS citas,
            COALESCE(SUM(estado = 'COMPLETADA'), 0) AS atendidas,
            COALESCE(SUM(estado = 'CONFIRMADA'), 0) AS confirmadas,
            COALESCE(SUM(estado = 'PENDIENTE'), 0) AS pendientes,
            COALESCE(SUM(estado = 'CANCELADA'), 0) AS canceladas,
            COALESCE(SUM(CASE WHEN estado = 'COMPLETADA' THEN precio_total END), 0) AS ingresos,
            COALESCE(SUM(CASE WHEN estado = 'CONFIRMADA' THEN precio_total END), 0) AS por_cobrar,
            COUNT(DISTINCT CASE WHEN estado <> 'CANCELADA' THEN dni_cliente END) AS clientes
        FROM citas
        WHERE id_barberia = ? AND fecha BETWEEN ? AND ?
    ");
    $stmt->execute([$idBarberia, $desdeTxt, $hastaTxt]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM (
            SELECT dni_cliente, MIN(fecha) AS primera
            FROM citas
            WHERE id_barberia = ? AND estado <> 'CANCELADA'
            GROUP BY dni_cliente
        ) t
        WHERE t.primera BETWEEN ? AND ?
    ");
    $stmt->execute([$idBarberia, $desdeTxt, $hastaTxt]);
    $clientesNuevos = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT AVG(r.calificacion) AS promedio, COUNT(*) AS cantidad
        FROM resenas r
        INNER JOIN citas c ON c.id_cita = r.id_cita
        WHERE c.id_barberia = ?
    ");
    $stmt->execute([$idBarberia]);
    $resenas = $stmt->fetch(PDO::FETCH_ASSOC);

    $atendidas = (int) $r['atendidas'];
    $reservas = (int) $r['reservas'];
    $ingresos = (float) $r['ingresos'];

    // 2. Citas e ingresos por día (con los días sin citas en cero).
    $stmt = $pdo->prepare("
        SELECT
            fecha,
            COALESCE(SUM(estado <> 'CANCELADA'), 0) AS citas,
            COALESCE(SUM(CASE WHEN estado = 'COMPLETADA' THEN precio_total END), 0) AS ingresos
        FROM citas
        WHERE id_barberia = ? AND fecha BETWEEN ? AND ?
        GROUP BY fecha
    ");
    $stmt->execute([$idBarberia, $desdeTxt, $hastaTxt]);
    $porFecha = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $fila) {
        $porFecha[$fila['fecha']] = $fila;
    }
    $porDia = [];
    for ($dia = $desde; $dia->format('Y-m-d') <= $hastaTxt; $dia = $dia->modify('+1 day')) {
        $clave = $dia->format('Y-m-d');
        $porDia[] = [
            'fecha' => $clave,
            'citas' => (int) ($porFecha[$clave]['citas'] ?? 0),
            'ingresos' => (float) ($porFecha[$clave]['ingresos'] ?? 0),
        ];
    }

    // 3. Desempeño por barbero (incluye al administrador que atiende).
    $stmt = $pdo->prepare("
        SELECT
            u.id_usuario AS id_barbero,
            u.nombre_completo AS nombre,
            COALESCE(SUM(c.estado <> 'CANCELADA'), 0) AS citas,
            COALESCE(SUM(c.estado = 'COMPLETADA'), 0) AS atendidas,
            COALESCE(SUM(c.estado = 'CANCELADA'), 0) AS canceladas,
            COALESCE(SUM(CASE WHEN c.estado = 'COMPLETADA' THEN c.precio_total END), 0) AS ingresos,
            (
                SELECT AVG(r.calificacion)
                FROM resenas r
                INNER JOIN citas c2 ON c2.id_cita = r.id_cita
                WHERE c2.id_barbero = u.id_usuario
            ) AS calificacion
        FROM usuarios u
        LEFT JOIN citas c
            ON c.id_barbero = u.id_usuario AND c.id_barberia = u.id_barberia AND c.fecha BETWEEN ? AND ?
        WHERE u.id_barberia = ?
          AND u.estado = 'ACTIVO'
          AND (u.rol = 'BARBERO' OR (u.rol = 'ADMINISTRADOR' AND u.atiende_clientes = 1))
        GROUP BY u.id_usuario, u.nombre_completo
        ORDER BY ingresos DESC, citas DESC, u.nombre_completo ASC
    ");
    $stmt->execute([$desdeTxt, $hastaTxt, $idBarberia]);
    $porBarbero = array_map(static fn (array $fila): array => [
        'id_barbero' => (int) $fila['id_barbero'],
        'nombre' => $fila['nombre'],
        'citas' => (int) $fila['citas'],
        'atendidas' => (int) $fila['atendidas'],
        'canceladas' => (int) $fila['canceladas'],
        'ingresos' => (float) $fila['ingresos'],
        'calificacion' => $fila['calificacion'] === null ? null : round((float) $fila['calificacion'], 1),
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));

    // 4. Servicios más pedidos en citas no canceladas.
    $stmt = $pdo->prepare("
        SELECT
            s.id_servicio,
            s.nombre,
            COUNT(*) AS veces,
            COALESCE(SUM(cs.precio_historico), 0) AS valor
        FROM cita_servicios cs
        INNER JOIN citas c ON c.id_cita = cs.id_cita
        INNER JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE c.id_barberia = ? AND c.fecha BETWEEN ? AND ? AND c.estado <> 'CANCELADA'
        GROUP BY s.id_servicio, s.nombre
        ORDER BY veces DESC, s.nombre ASC
        LIMIT 6
    ");
    $stmt->execute([$idBarberia, $desdeTxt, $hastaTxt]);
    $servicios = array_map(static fn (array $fila): array => [
        'id_servicio' => (int) $fila['id_servicio'],
        'nombre' => $fila['nombre'],
        'veces' => (int) $fila['veces'],
        'valor' => (float) $fila['valor'],
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode([
        'status' => 'success',
        'periodo' => ['clave' => $periodo, 'desde' => $desdeTxt, 'hasta' => $hastaTxt],
        'resumen' => [
            'citas' => (int) $r['citas'],
            'atendidas' => $atendidas,
            'confirmadas' => (int) $r['confirmadas'],
            'pendientes' => (int) $r['pendientes'],
            'canceladas' => (int) $r['canceladas'],
            'ingresos' => $ingresos,
            'por_cobrar' => (float) $r['por_cobrar'],
            'ticket_promedio' => $atendidas > 0 ? round($ingresos / $atendidas) : 0,
            'clientes' => (int) $r['clientes'],
            'clientes_nuevos' => $clientesNuevos,
            'tasa_cancelacion' => $reservas > 0 ? round(100 * (int) $r['canceladas'] / $reservas, 1) : 0,
            'calificacion' => $resenas['promedio'] === null ? null : round((float) $resenas['promedio'], 1),
            'cantidad_resenas' => (int) $resenas['cantidad'],
        ],
        'por_dia' => $porDia,
        'por_barbero' => $porBarbero,
        'servicios' => $servicios,
    ]);
} catch (Throwable $error) {
    error_log('Error al obtener métricas: ' . $error->getMessage());
    $codigo = $error instanceof PDOException ? (string) $error->getCode() : 'PHP';
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => "No se pudieron cargar las métricas (código {$codigo})."]);
}
