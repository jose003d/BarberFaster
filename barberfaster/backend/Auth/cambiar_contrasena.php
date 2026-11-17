<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/common.php';

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
    $usuario = requerirRol($pdo, ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'], true);
    if ($usuario['rol'] === 'SUPERADMIN') {
        responderErrorAuth(403, 'La cuenta superadmin no puede cambiar su contraseña desde la plataforma.');
    }

    $datos = json_decode(file_get_contents('php://input'), true);

    if (!is_array($datos)) {
        responderErrorAuth(400, 'Los datos enviados no son válidos.');
    }

    $contrasenaActual = $datos['contrasena_actual'] ?? null;
    $contrasenaNueva = $datos['contrasena_nueva'] ?? null;
    if (
        !is_string($contrasenaActual)
        || $contrasenaActual === ''
        || strlen($contrasenaActual) > 4096
        || !is_string($contrasenaNueva)
        || longitudCampoAuth($contrasenaNueva) < 8
        || strlen($contrasenaNueva) > 72
    ) {
        responderErrorAuth(422, 'La contraseña nueva debe tener al menos 8 caracteres y no superar 72 caracteres.');
    }

    $stmt = $pdo->prepare('SELECT password FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1');
    $stmt->execute([':id_usuario' => $usuario['id_usuario']]);
    $contrasenaGuardada = $stmt->fetchColumn();

    if (!is_string($contrasenaGuardada) || !password_verify($contrasenaActual, $contrasenaGuardada)) {
        responderErrorAuth(422, 'La contraseña actual es incorrecta.');
    }

    if (password_verify($contrasenaNueva, $contrasenaGuardada)) {
        responderErrorAuth(422, 'La contraseña nueva debe ser diferente a la actual.');
    }

    $hash = password_hash($contrasenaNueva, PASSWORD_DEFAULT);
    if (!is_string($hash)) {
        throw new RuntimeException('No se pudo generar el hash de la contraseña.');
    }

    $stmt = $pdo->prepare('
        UPDATE usuarios
        SET password = :password, debe_cambiar_contrasena = 0
        WHERE id_usuario = :id_usuario
    ');
    $stmt->execute([
        ':password' => $hash,
        ':id_usuario' => $usuario['id_usuario'],
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'La contraseña se actualizó correctamente.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al actualizar la contraseña del usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar la contraseña.']);
}
