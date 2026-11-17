<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

$idBarberia = filter_input(INPUT_GET, 'id_barberia', FILTER_VALIDATE_INT);
if (!$idBarberia || $idBarberia < 1) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => 'Indica una barbería válida.']);
    exit();
}

$idBarberoHistorial = null;
if (isset($_GET['id_barbero'])) {
    $idBarberoHistorial = filter_var($_GET['id_barbero'], FILTER_VALIDATE_INT);
    if (!$idBarberoHistorial || $idBarberoHistorial < 1) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un barbero válido para consultar su historial.']);
        exit();
    }
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../wompi/comun.php';

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    if ($usuario['rol'] === 'ADMINISTRADOR') {
        $idBarberia = $usuario['id_barberia'];
        if (!$idBarberia) {
            responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
        }
    }

    $ahora = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
    $ahoraSql = $ahora->format('Y-m-d H:i:s');

    wompiLiberarPagosVencidos($pdo);

    // Solo se completan citas que fueron confirmadas después del pago.
    $actualizarVencidas = $pdo->prepare("
        UPDATE citas
        SET estado = 'COMPLETADA'
        WHERE id_barberia = ?
          AND estado = 'CONFIRMADA'
          AND EXISTS (
              SELECT 1
              FROM wompi_pagos p
              WHERE p.id_cita = citas.id_cita AND p.estado = 'APPROVED'
          )
          AND CONCAT(fecha, ' ', hora_fin) <= ?
    ");
    $actualizarVencidas->execute([$idBarberia, $ahoraSql]);

    $stmtBarberia = $pdo->prepare("
        SELECT id_usuario AS id_barbero, nombre_completo AS nombre,
               '' AS apellido, NULL AS especialidad
        FROM usuarios
        WHERE id_barberia = ? AND (rol = 'BARBERO' OR (rol = 'ADMINISTRADOR' AND atiende_clientes = 1)) AND estado = 'ACTIVO'
        ORDER BY nombre_completo
    ");
    $stmtBarberia->execute([$idBarberia]);
    $barberos = $stmtBarberia->fetchAll(PDO::FETCH_ASSOC);

    $stmtProximas = $pdo->prepare("
        SELECT
            c.id_cita,
            c.id_barbero,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.estado,
            cl.nombre AS nombre_cliente,
            b.nombre_completo AS nombre_barbero,
            '' AS apellido_barbero,
            GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
        FROM citas c
        INNER JOIN usuarios b ON b.id_usuario = c.id_barbero
        INNER JOIN clientes cl ON cl.dni = c.dni_cliente
        LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
        LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE c.id_barberia = ?
          AND (b.rol = 'BARBERO' OR (b.rol = 'ADMINISTRADOR' AND b.atiende_clientes = 1))
          AND b.estado = 'ACTIVO'
          AND c.estado IN ('PENDIENTE', 'CONFIRMADA')
          AND CONCAT(c.fecha, ' ', c.hora_fin) > ?
        GROUP BY c.id_cita
        ORDER BY c.fecha ASC, c.hora_inicio ASC
    ");
    $stmtProximas->execute([$idBarberia, $ahoraSql]);

    $historial = [];
    if ($idBarberoHistorial !== null) {
        $stmtHistorial = $pdo->prepare("
            SELECT
                c.id_cita,
                c.id_barbero,
                c.fecha,
                c.hora_inicio,
                c.hora_fin,
                c.estado,
                cl.nombre AS nombre_cliente,
                b.nombre_completo AS nombre_barbero,
                '' AS apellido_barbero,
                GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
            FROM citas c
            INNER JOIN usuarios b ON b.id_usuario = c.id_barbero
            INNER JOIN clientes cl ON cl.dni = c.dni_cliente
            LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
            LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
            WHERE c.id_barberia = ?
              AND c.id_barbero = ?
              AND (b.rol = 'BARBERO' OR (b.rol = 'ADMINISTRADOR' AND b.atiende_clientes = 1))
              AND (
                c.estado IN ('COMPLETADA', 'CANCELADA')
                OR (
                  c.estado IN ('PENDIENTE', 'CONFIRMADA')
                  AND CONCAT(c.fecha, ' ', c.hora_fin) <= ?
                )
              )
            GROUP BY c.id_cita
            ORDER BY c.fecha DESC, c.hora_inicio DESC
        ");
        $stmtHistorial->execute([$idBarberia, $idBarberoHistorial, $ahoraSql]);
        $historial = $stmtHistorial->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'status' => 'success',
        'barberos' => $barberos,
        'proximas' => $stmtProximas->fetchAll(PDO::FETCH_ASSOC),
        'historial' => $historial,
    ]);
} catch (Throwable $error) {
    error_log('Error al cargar agenda general de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar la agenda de la barbería.']);
}
