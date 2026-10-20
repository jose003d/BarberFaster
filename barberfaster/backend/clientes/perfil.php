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

$sesion = leerSesionCliente();
try {
    $cliente = $sesion === false ? false : obtenerClienteAutenticado($pdo);
} catch (Throwable $e) {
    error_log('Error al validar la sesión del cliente: ' . $e->getMessage());
    responder(500, false, 'No se pudo cargar el perfil del cliente.');
}
if ($sesion === false || $cliente === false) {
    responder(401, false, 'La sesión venció o los datos no coinciden. Verifica nuevamente tu WhatsApp.');
}

responder(200, true, 'Perfil del cliente cargado.', [
    'cliente' => $cliente,
    'sesion_expira_en' => (int)$sesion['expira_en'],
]);
