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

$data = json_decode(file_get_contents('php://input'), true);
$mensajeGenerico = 'Documento/correo o contraseña incorrectos, o cuenta inactiva.';

if (!is_array($data)) {
    responderErrorAuth(400, 'Los datos enviados no son válidos.');
}

$identificador = $data['identificador'] ?? $data['email'] ?? null;
$password = $data['password'] ?? null;
$identificadorValido = is_string($identificador);
$identificador = $identificadorValido ? trim($identificador) : '';
$esCorreo = strpos($identificador, '@') !== false;

if (
    !$identificadorValido
    || $identificador === ''
    || ($esCorreo
        ? (longitudCampoAuth($identificador) > 120 || !filter_var($identificador, FILTER_VALIDATE_EMAIL))
        : longitudCampoAuth($identificador) > 30)
    || !is_string($password)
    || $password === ''
    || strlen($password) > 4096
) {
    responderErrorAuth(422, 'Revisa el documento o correo y la contraseña ingresados.');
}

try {
    $stmt = $pdo->prepare("
        SELECT id_usuario, id_barberia, documento, nombre_completo, telefono, correo, password, rol, estado, debe_cambiar_contrasena, atiende_clientes
        FROM usuarios
        WHERE documento = :identificador_documento
           OR correo = :identificador_correo
        LIMIT 1
    ");
    $stmt->execute([
        ':identificador_documento' => $identificador,
        ':identificador_correo' => $identificador,
    ]);
    $usuario = $stmt->fetch();

    $hash = is_string($usuario['password'] ?? null)
        ? $usuario['password']
        : '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
    $passwordValido = password_verify($password, $hash);

    if (
        !$usuario
        || !$passwordValido
        || $usuario['estado'] !== 'ACTIVO'
        || !in_array($usuario['rol'], ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'], true)
    ) {
        responderErrorAuth(401, $mensajeGenerico);
    }

    if ($usuario['rol'] === 'SUPERADMIN' && !esAccesoSuperadminPermitido()) {
        responderErrorAuth(403, 'El acceso SUPERADMIN no está habilitado en este dominio.');
    }

    iniciarSesionUsuario();
    session_regenerate_id(true);
    $_SESSION['usuario'] = [
        'id_usuario' => (int) $usuario['id_usuario'],
    ];

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Inicio de sesión exitoso.',
        'usuario' => [
            'id_usuario' => (int) $usuario['id_usuario'],
            'id_barberia' => $usuario['id_barberia'] === null
                ? null
                : (int) $usuario['id_barberia'],
            'documento' => $usuario['documento'],
            'nombre_completo' => $usuario['nombre_completo'],
            'nombre' => $usuario['nombre_completo'],
            'telefono' => $usuario['telefono'],
            'correo' => $usuario['correo'],
            'email' => $usuario['correo'],
            'rol' => $usuario['rol'],
            'estado' => $usuario['estado'],
            'debe_cambiar_contrasena' => $usuario['rol'] !== 'SUPERADMIN'
                && (bool) $usuario['debe_cambiar_contrasena'],
            'atiende_clientes' => $usuario['rol'] === 'BARBERO'
                || ($usuario['rol'] === 'ADMINISTRADOR' && (bool) $usuario['atiende_clientes']),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('Error al iniciar sesión: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo iniciar sesión. Inténtalo de nuevo.']);
}
