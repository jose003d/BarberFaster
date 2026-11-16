<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    requerirRol($pdo, ['SUPERADMIN']);
    $stmt = $pdo->query("
        SELECT id_solicitud, nombre_barberia, direccion, ciudad, telefono_barberia,
               nombre_admin, documento_admin, telefono_admin, correo_admin, creado_en
        FROM solicitudes_barberia
        WHERE estado = 'PENDIENTE'
        ORDER BY creado_en ASC
    ");
    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al consultar solicitudes de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las solicitudes.']);
}
