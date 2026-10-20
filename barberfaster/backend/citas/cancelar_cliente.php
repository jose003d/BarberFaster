<?php

declare(strict_types=1);

require_once '../config/database.php';
require_once '../verificacion/comun.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, false, 'Método no permitido.');
}

try {
    $cliente = obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar sesión para cancelar cita: ' . $e->getMessage());
    responder(500, false, 'No se pudo validar la sesión del cliente.');
}
if ($cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

$datos = obtenerJsonBody();
$idCita = filter_var($datos['id_cita'] ?? null, FILTER_VALIDATE_INT);
if ($idCita === false || $idCita < 1) {
    responder(400, false, 'El identificador de la cita no es válido.');
}

try {
    $stmt = $pdo->prepare("
        UPDATE citas
        SET estado = 'CANCELADA'
        WHERE id_cita = ? AND dni_cliente = ? AND estado IN ('PENDIENTE', 'CONFIRMADA')
    ");
    $stmt->execute([$idCita, $cliente['dni']]);

    if ($stmt->rowCount() === 0) {
        responder(409, false, 'La cita no existe, no te pertenece o ya no está pendiente.');
    }

    responder(200, true, 'La cita se canceló correctamente.');
} catch (Throwable $e) {
    error_log('Error al cancelar cita de cliente: ' . $e->getMessage());
    responder(500, false, 'No se pudo cancelar la cita.');
}
