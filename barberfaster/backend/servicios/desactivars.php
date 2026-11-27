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
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    $data = json_decode(file_get_contents('php://input'), true);
    $idServicio = filter_var(
        is_array($data) ? ($data['id_servicio'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    $estado = strtoupper(trim((string) ($data['estado'] ?? 'INACTIVO')));

    if (
        !$idServicio
        || $idServicio < 1
        || !in_array($estado, ['ACTIVO', 'INACTIVO'], true)
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un servicio y un estado válidos.']);
        exit();
    }

    $stmtActual = $pdo->prepare('SELECT id_barberia FROM servicios WHERE id_servicio = :id_servicio LIMIT 1');
    $stmtActual->execute([':id_servicio' => $idServicio]);
    $idBarberia = $stmtActual->fetchColumn();
    if (
        $idBarberia === false
        || ($usuario['rol'] === 'ADMINISTRADOR' && (int) $idBarberia !== $usuario['id_barberia'])
    ) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el servicio de esa barbería.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE servicios
        SET estado = :estado
        WHERE id_servicio = :id_servicio
    ");
    $stmt->execute([
        ':estado' => $estado,
        ':id_servicio' => $idServicio,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Estado del servicio actualizado.', 'estado' => $estado]);
} catch (Throwable $error) {
    error_log('Error al cambiar el estado de un servicio: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el estado del servicio.']);
}
