<?php

declare(strict_types=1);

require_once '../config/database.php';
require_once '../verificacion/comun.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    responder(405, false, 'Método no permitido.');
}

try {
    $cliente = obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar sesión para listar citas: ' . $e->getMessage());
    responder(500, false, 'No se pudieron cargar las citas.');
}
if ($cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

try {
    $stmt = $pdo->prepare("
        SELECT
            c.id_cita,
            c.id_barberia,
            b.nombre AS nombre_barberia,
            c.id_barbero,
            bar.nombre AS nombre_barbero,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.precio_total,
            c.estado,
            c.notas,
            GROUP_CONCAT(s.nombre SEPARATOR ', ') AS servicios_nombres
        FROM citas c
        INNER JOIN barberias b ON c.id_barberia = b.id_barberia
        INNER JOIN barberos bar ON c.id_barbero = bar.id_barbero
        LEFT JOIN cita_servicios cs ON c.id_cita = cs.id_cita
        LEFT JOIN servicios s ON cs.id_servicio = s.id_servicio
        WHERE c.dni_cliente = ?
        GROUP BY c.id_cita
        ORDER BY c.fecha DESC, c.hora_inicio DESC
    ");
    $stmt->execute([$cliente['dni']]);
    responder(200, true, 'Citas del cliente cargadas.', ['datos' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Error al listar las citas del cliente: ' . $e->getMessage());
    responder(500, false, 'No se pudieron cargar las citas.');
}
