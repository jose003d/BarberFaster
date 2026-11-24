<?php
// Devuelve las citas de un barbero para separar próximos turnos e historial.
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
    $usuario = requerirRol($pdo, ['BARBERO']);
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

    // Limita la respuesta a los datos necesarios para la agenda del barbero.
    $stmt = $pdo->prepare("
        SELECT
            c.id_cita,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.estado,
            GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
        FROM citas c
        LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
        LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE c.id_barbero = ?
        GROUP BY c.id_cita
        ORDER BY c.fecha ASC, c.hora_inicio ASC
    ");
    $stmt->execute([$idBarbero]);

    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()]);
} catch (Throwable $error) {
    error_log('Error al listar citas del perfil de barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las citas.']);
}
