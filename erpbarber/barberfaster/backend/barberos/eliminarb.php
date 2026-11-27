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
    $sesion = requerirRol($pdo, ['ADMINISTRADOR']);
    $data = json_decode(file_get_contents('php://input'), true);
    $idUsuario = filter_var(
        is_array($data) ? ($data['id_usuario'] ?? $data['id_barbero'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    $estado = strtoupper(trim((string) ($data['estado'] ?? 'INACTIVO')));
    if (!$idUsuario || $idUsuario < 1 || !in_array($estado, ['ACTIVO', 'INACTIVO'], true)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un barbero y un estado válidos.']);
        exit();
    }

    $stmtActual = $pdo->prepare("
        SELECT id_barberia
        FROM usuarios
        WHERE id_usuario = :id_usuario AND rol = 'BARBERO'
        LIMIT 1
    ");
    $stmtActual->execute([':id_usuario' => $idUsuario]);
    $idBarberia = $stmtActual->fetchColumn();
    if (
        $idBarberia === false
        || ($sesion['rol'] === 'ADMINISTRADOR' && (int) $idBarberia !== $sesion['id_barberia'])
    ) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el barbero de esa barbería.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET estado = :estado
        WHERE id_usuario = :id_usuario AND rol = 'BARBERO'
    ");
    $stmt->execute([':estado' => $estado, ':id_usuario' => $idUsuario]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Estado del barbero actualizado correctamente.',
        'estado' => $estado,
    ]);
} catch (Throwable $error) {
    error_log('Error al cambiar el estado de un barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el estado del barbero.']);
}
