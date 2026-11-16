<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    $usuario = requerirRol($pdo, ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'], true);
    echo json_encode(['status' => 'success', 'usuario' => $usuario], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al validar la sesión: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo validar la sesión.']);
}
