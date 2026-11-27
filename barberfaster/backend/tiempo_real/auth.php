<?php
// Autoriza que el navegador de un barbero se suscriba a SU canal privado de Pusher.
// El ID del canal se compara con la sesión: un barbero nunca escucha el canal de otro.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/pusher.php';

try {
    $usuario = requerirRol($pdo, ['BARBERO']);
} catch (Throwable $error) {
    error_log('Error al validar la sesión para Pusher: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo validar la sesión.']);
    exit();
}

// pusher-js envía socket_id y channel_name como formulario.
$socketId = (string) ($_POST['socket_id'] ?? '');
$canal = (string) ($_POST['channel_name'] ?? '');

if (!preg_match('/^\d+\.\d+$/', $socketId) || $canal !== pusherCanalBarbero($usuario['id_usuario'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'mensaje' => 'No puedes escuchar ese canal.']);
    exit();
}

$firma = pusherFirmarSuscripcion($socketId, $canal);
if ($firma === null) {
    http_response_code(503);
    echo json_encode(['status' => 'error', 'mensaje' => 'Los avisos en vivo no están configurados.']);
    exit();
}

echo json_encode(['auth' => $firma]);
