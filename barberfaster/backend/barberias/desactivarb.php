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
    $estado = strtoupper(trim((string) ($data['estado'] ?? 'INACTIVA')));

    if (
        !$idBarberia
        || $idBarberia < 1
        || !in_array($estado, ['ACTIVA', 'INACTIVA'], true)
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica una barbería y un estado válidos.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE barberias
        SET estado = :estado
        WHERE id_barberia = :id_barberia
    ");
    $stmt->execute([
        ':estado' => $estado,
        ':id_barberia' => $idBarberia,
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Estado de la barbería actualizado.',
        'estado' => $estado,
    ]);
} catch (Throwable $error) {
    error_log('Error al cambiar el estado de una barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el estado de la barbería.']);
}
