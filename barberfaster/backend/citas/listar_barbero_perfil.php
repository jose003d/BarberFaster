<?php
// Devuelve la agenda de un día del barbero que inició sesión (?fecha=YYYY-MM-DD; hoy por defecto).
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../wompi/comun.php';

try {
    $usuario = requerirBarberoEnSesion($pdo);
    $idBarbero = $usuario['id_usuario'];

    wompiLiberarPagosVencidos($pdo);

    // Se completan citas confirmadas: pagadas con Wompi o con pago en el local.
    $ahora = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
    $actualizarVencidas = $pdo->prepare("
        UPDATE citas
        SET estado = 'COMPLETADA'
        WHERE id_barbero = ?
          AND estado = 'CONFIRMADA'
          AND NOT EXISTS (
              SELECT 1
              FROM wompi_pagos p
              WHERE p.id_cita = citas.id_cita AND p.estado <> 'APPROVED'
          )
          AND CONCAT(fecha, ' ', hora_fin) <= ?
    ");
    $actualizarVencidas->execute([$idBarbero, $ahora->format('Y-m-d H:i:s')]);

    // Agenda de un solo día (hoy en Bogotá si no se indica otra fecha).
    $fecha = (string) ($_GET['fecha'] ?? $ahora->format('Y-m-d'));
    $fechaValida = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha);
    if (!$fechaValida || $fechaValida->format('Y-m-d') !== $fecha) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'La fecha indicada no es válida.']);
        exit();
    }

    // Solo lo que el barbero necesita para atender: quién viene, a qué hora y a qué.
    $stmt = $pdo->prepare("
        SELECT
            c.id_cita,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.estado,
            c.precio_total,
            c.notas,
            c.creado_en,
            cl.nombre AS nombre_cliente,
            cl.telefono AS telefono_cliente,
            GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
        FROM citas c
        LEFT JOIN clientes cl ON cl.dni = c.dni_cliente
        LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
        LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE c.id_barbero = ? AND c.fecha = ?
        GROUP BY c.id_cita
        ORDER BY c.hora_inicio ASC
    ");
    $stmt->execute([$idBarbero, $fecha]);

    echo json_encode([
        'status' => 'success',
        'fecha' => $fecha,
        // Hora del servidor para calcular "quién sigue" sin depender del reloj del dispositivo.
        'ahora' => $ahora->format('Y-m-d H:i:s'),
        'datos' => $stmt->fetchAll(),
    ]);
} catch (Throwable $error) {
    error_log('Error al listar citas del perfil de barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las citas.']);
}
