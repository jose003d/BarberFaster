<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    requerirRol($pdo, ['SUPERADMIN']);
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = trim((string) ($data['nombre'] ?? ''));
    $direccion = trim((string) ($data['direccion'] ?? ''));
    $ciudad = trim((string) ($data['ciudad'] ?? ''));
    $telefono = trim((string) ($data['telefono'] ?? ''));

    if (
        !is_array($data)
        || $nombre === ''
        || $direccion === ''
        || $ciudad === ''
        || $telefono === ''
        || strlen($nombre) > 100
        || strlen($direccion) > 150
        || strlen($ciudad) > 80
        || strlen($telefono) > 20
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos de la barbería.']);
        exit();
    }

    $stmt = $pdo->prepare("
        INSERT INTO barberias (nombre, direccion, ciudad, telefono, foto, estado)
        VALUES (:nombre, :direccion, :ciudad, :telefono, :foto, 'ACTIVA')
    ");
    $stmt->execute([
        ':nombre' => $nombre,
        ':direccion' => $direccion,
        ':ciudad' => $ciudad,
        ':telefono' => $telefono,
        ':foto' => $data['foto'] ?? null,
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Barbería registrada correctamente.',
        'id_barberia' => (int) $pdo->lastInsertId(),
    ]);
} catch (Throwable $error) {
    error_log('Error al crear una barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo registrar la barbería.']);
}
