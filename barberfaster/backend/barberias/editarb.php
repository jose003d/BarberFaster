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
    $idBarberia = filter_var(
        is_array($data) ? ($data['id_barberia'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    $nombre = trim((string) ($data['nombre'] ?? ''));
    $direccion = trim((string) ($data['direccion'] ?? ''));
    $ciudad = trim((string) ($data['ciudad'] ?? ''));
    $telefono = trim((string) ($data['telefono'] ?? ''));
    $estado = isset($data['estado'])
        ? strtoupper(trim((string) $data['estado']))
        : null;

    if (
        !$idBarberia
        || $idBarberia < 1
        || $nombre === ''
        || strlen($nombre) > 100
        || strlen($direccion) > 150
        || strlen($ciudad) > 80
        || strlen($telefono) > 20
        || ($estado !== null && !in_array($estado, ['ACTIVA', 'INACTIVA'], true))
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos de la barbería.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE barberias
        SET nombre = :nombre,
            direccion = :direccion,
            ciudad = :ciudad,
            telefono = :telefono,
            estado = COALESCE(:estado, estado)
        WHERE id_barberia = :id_barberia
    ");
    $stmt->execute([
        ':id_barberia' => $idBarberia,
        ':nombre' => $nombre,
        ':direccion' => $direccion,
        ':ciudad' => $ciudad,
        ':telefono' => $telefono,
        ':estado' => $estado,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Barbería actualizada correctamente.']);
} catch (Throwable $error) {
    error_log('Error al actualizar una barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar la barbería.']);
}
