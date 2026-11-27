<?php
// Entrega al barbero con sesión la URL del WebSocket y un permiso firmado para
// escuchar SOLO su canal. El secreto nunca sale del servidor.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/comun.php';

try {
    $usuario = requerirRol($pdo, ['BARBERO']);
} catch (Throwable $error) {
    error_log('Error al validar la sesión para el tiempo real: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo validar la sesión.']);
    exit();
}

$config = tiempoRealConfiguracion();
$token = tiempoRealToken($usuario['id_usuario']);

echo json_encode([
    'status' => 'success',
    'datos' => $config === null || $token === null
        ? ['activo' => false]
        : ['activo' => true, 'url' => $config['ws_url'], 'token' => $token],
]);
