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

$datos = json_decode(file_get_contents('php://input'), true);
if (!is_array($datos)) {
    responderErrorAuth(400, 'Los datos enviados no son válidos.');
}

$correo = is_string($datos['correo'] ?? null) ? trim($datos['correo']) : '';
$codigo = $datos['codigo'] ?? null;
$contrasenaNueva = $datos['contrasena_nueva'] ?? null;
if (
    $correo === ''
    || longitudCampoAuth($correo) > 120
    || !filter_var($correo, FILTER_VALIDATE_EMAIL)
    || !is_string($codigo)
    || !preg_match('/^\d{6}$/', $codigo)
    || !is_string($contrasenaNueva)
    || longitudCampoAuth($contrasenaNueva) < 8
    || strlen($contrasenaNueva) > 72
) {
    responderErrorAuth(422, 'Revisa el correo, el código y la contraseña nueva. Debe tener al menos 8 caracteres y no superar 72 caracteres.');
}

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("
        SELECT
            u.id_usuario,
            r.codigo_hash,
            r.expira_en <= NOW() AS expirado,
            r.intentos,
            u.password
        FROM usuarios u
        INNER JOIN recuperacion_contrasena r ON r.id_usuario = u.id_usuario
        WHERE u.correo = :correo
          AND u.estado = 'ACTIVO'
          AND u.rol IN ('ADMINISTRADOR', 'BARBERO')
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([':correo' => $correo]);
    $registro = $stmt->fetch();

    if (!$registro) {
        $pdo->commit();
        responderErrorAuth(422, 'El código no es válido o ha vencido. Solicita uno nuevo.');
    }

    if ((int) $registro['expirado'] === 1) {
        $stmt = $pdo->prepare('DELETE FROM recuperacion_contrasena WHERE id_usuario = :id_usuario');
        $stmt->execute([':id_usuario' => $registro['id_usuario']]);
        $pdo->commit();
        responderErrorAuth(422, 'El código no es válido o ha vencido. Solicita uno nuevo.');
    }

    if ((int) $registro['intentos'] >= 5) {
        $stmt = $pdo->prepare('DELETE FROM recuperacion_contrasena WHERE id_usuario = :id_usuario');
        $stmt->execute([':id_usuario' => $registro['id_usuario']]);
        $pdo->commit();
        responderErrorAuth(429, 'Se agotaron los intentos. Solicita un código nuevo.');
    }

    if (!password_verify($codigo, $registro['codigo_hash'])) {
        $intentos = (int) $registro['intentos'] + 1;
        if ($intentos >= 5) {
            $stmt = $pdo->prepare('DELETE FROM recuperacion_contrasena WHERE id_usuario = :id_usuario');
            $stmt->execute([':id_usuario' => $registro['id_usuario']]);
            $pdo->commit();
            responderErrorAuth(429, 'Se agotaron los intentos. Solicita un código nuevo.');
        }

        $stmt = $pdo->prepare('UPDATE recuperacion_contrasena SET intentos = :intentos WHERE id_usuario = :id_usuario');
        $stmt->execute([
            ':intentos' => $intentos,
            ':id_usuario' => $registro['id_usuario'],
        ]);
        $pdo->commit();
        responderErrorAuth(422, 'El código no es válido o ha vencido. Solicita uno nuevo.');
    }

    if (password_verify($contrasenaNueva, $registro['password'])) {
        $pdo->commit();
        responderErrorAuth(422, 'La contraseña nueva debe ser diferente a la actual.');
    }

    $hash = password_hash($contrasenaNueva, PASSWORD_DEFAULT);
    if (!is_string($hash)) {
        throw new RuntimeException('No se pudo generar el hash de la contraseña nueva.');
    }

    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET password = :password, debe_cambiar_contrasena = 0
        WHERE id_usuario = :id_usuario
    ");
    $stmt->execute([
        ':password' => $hash,
        ':id_usuario' => $registro['id_usuario'],
    ]);

    $stmt = $pdo->prepare('DELETE FROM recuperacion_contrasena WHERE id_usuario = :id_usuario');
    $stmt->execute([':id_usuario' => $registro['id_usuario']]);
    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'La contraseña se restableció correctamente. Ya puedes iniciar sesión.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al restablecer la contraseña: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'mensaje' => 'No se pudo restablecer la contraseña. Inténtalo de nuevo.',
    ], JSON_UNESCAPED_UNICODE);
}
