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
$correo = is_array($datos) && is_string($datos['correo'] ?? null)
    ? trim($datos['correo'])
    : '';
$respuestaGenerica = [
    'status' => 'success',
    'mensaje' => 'Si el correo corresponde a una cuenta elegible, recibirás un código de recuperación.',
];

if (
    $correo === ''
    || longitudCampoAuth($correo) > 120
    || !filter_var($correo, FILTER_VALIDATE_EMAIL)
) {
    responderErrorAuth(422, 'Ingresa un correo electrónico válido.');
}

$remitente = getenv('PASSWORD_RESET_FROM');
if (!is_string($remitente) || !filter_var($remitente, FILTER_VALIDATE_EMAIL)) {
    error_log('PASSWORD_RESET_FROM no está configurado con un correo válido.');
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'mensaje' => 'El servicio de correo no está disponible. Inténtalo más tarde.',
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$cabeceras = "From: BarberFaster <{$remitente}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";

try {
    $stmt = $pdo->prepare("
        SELECT id_usuario, correo
        FROM usuarios
        WHERE correo = :correo
          AND estado = 'ACTIVO'
          AND rol IN ('ADMINISTRADOR', 'BARBERO')
        LIMIT 1
    ");
    $stmt->execute([':correo' => $correo]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        echo json_encode($respuestaGenerica, JSON_UNESCAPED_UNICODE);
        exit();
    }

    $codigo = (string) random_int(100000, 999999);
    $codigoHash = password_hash($codigo, PASSWORD_DEFAULT);
    if (!is_string($codigoHash)) {
        throw new RuntimeException('No se pudo generar el hash del código de recuperación.');
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("
        SELECT solicitado_en, solicitado_en >= DATE_SUB(NOW(), INTERVAL 1 MINUTE) AS reciente
        FROM recuperacion_contrasena
        WHERE id_usuario = :id_usuario
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([':id_usuario' => $usuario['id_usuario']]);
    $solicitudAnterior = $stmt->fetch();
    if ($solicitudAnterior && (int) $solicitudAnterior['reciente'] === 1) {
        $pdo->commit();
        echo json_encode($respuestaGenerica, JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt = $pdo->prepare("
        INSERT INTO recuperacion_contrasena (id_usuario, codigo_hash, expira_en, solicitado_en, intentos)
        VALUES (:id_usuario, :codigo_hash, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW(), 0)
        ON DUPLICATE KEY UPDATE
            codigo_hash = VALUES(codigo_hash),
            expira_en = VALUES(expira_en),
            solicitado_en = VALUES(solicitado_en),
            intentos = 0
    ");
    $stmt->execute([
        ':id_usuario' => $usuario['id_usuario'],
        ':codigo_hash' => $codigoHash,
    ]);
    $pdo->commit();

    $asunto = 'Código de recuperación de contraseña - BarberFaster';
    $mensaje = "Tu código para restablecer la contraseña es: {$codigo}\n\n"
        . "El código vence en 15 minutos y solo puede usarse una vez. "
        . "Si no solicitaste este cambio, ignora este mensaje.";

    if (!mail($usuario['correo'], $asunto, $mensaje, $cabeceras)) {
        $stmt = $pdo->prepare("
            DELETE FROM recuperacion_contrasena
            WHERE id_usuario = :id_usuario AND codigo_hash = :codigo_hash
        ");
        $stmt->execute([
            ':id_usuario' => $usuario['id_usuario'],
            ':codigo_hash' => $codigoHash,
        ]);
        throw new RuntimeException('PHP mail() no pudo enviar el correo de recuperación.');
    }

    echo json_encode($respuestaGenerica, JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error al solicitar recuperación de contraseña: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'mensaje' => 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.',
    ], JSON_UNESCAPED_UNICODE);
}
