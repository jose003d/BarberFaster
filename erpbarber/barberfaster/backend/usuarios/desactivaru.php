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
        is_array($data) ? ($data['id_usuario'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    if (!$idUsuario || $idUsuario < 1) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un usuario válido.']);
        exit();
    }

    $stmtUsuario = $pdo->prepare("
        SELECT id_usuario, id_barberia, rol, estado
        FROM usuarios
        WHERE id_usuario = :id_usuario
        LIMIT 1
    ");
    $stmtUsuario->execute([':id_usuario' => $idUsuario]);
    $usuario = $stmtUsuario->fetch();

    if (
        !$usuario
        || !in_array($usuario['rol'], ['BARBERO', 'ADMINISTRADOR'], true)
        || ($sesion['rol'] === 'ADMINISTRADOR'
            && (
                $usuario['rol'] !== 'BARBERO'
                || (int) $usuario['id_barberia'] !== $sesion['id_barberia']
            ))
    ) {
        responderErrorAuth(404, 'No se encontró el usuario que deseas actualizar.');
    }

    $nuevoEstado = $usuario['estado'] === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET estado = :estado
        WHERE id_usuario = :id_usuario
    ");
    $stmt->execute([
        ':estado' => $nuevoEstado,
        ':id_usuario' => $idUsuario,
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Estado actualizado correctamente.',
        'estado' => $nuevoEstado,
    ]);
} catch (Throwable $error) {
    error_log('Error al cambiar el estado de un usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el estado del usuario.']);
}
