<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/validaciones.php';

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
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
        exit();
    }

    $nombre = trim((string) ($data['nombre_completo'] ?? $data['nombre'] ?? ''));
    $documento = trim((string) ($data['documento'] ?? ''));
    $telefono = trim((string) ($data['telefono'] ?? ''));
    $correo = trim((string) ($data['correo'] ?? $data['email'] ?? ''));
    $rolSolicitado = strtoupper(trim((string) ($data['rol'] ?? 'BARBERO')));

    if (!documentoColombiaValido($documento)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => MENSAJE_DOCUMENTO_INVALIDO]);
        exit();
    }

    if (
        $nombre === ''
        || strlen($nombre) > 150
        || strlen($telefono) > 20
        || $correo === ''
        || strlen($correo) > 120
        || !filter_var($correo, FILTER_VALIDATE_EMAIL)
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa el nombre, documento, teléfono y correo ingresados.']);
        exit();
    }

    if (!in_array($rolSolicitado, ['BARBERO', 'ADMINISTRADOR'], true)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'El rol seleccionado no es válido.']);
        exit();
    }

    if ($sesion['rol'] === 'ADMINISTRADOR' && $rolSolicitado !== 'BARBERO') {
        responderErrorAuth(403, 'Solo el superadministrador puede registrar administradores.');
    }

    if ($sesion['rol'] === 'ADMINISTRADOR') {
        $idBarberia = $sesion['id_barberia'];
        if (!$idBarberia) {
            responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
        }
    } else {
        $idBarberia = filter_var($data['id_barberia'] ?? null, FILTER_VALIDATE_INT);
        if (!$idBarberia || $idBarberia < 1) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'Selecciona una barbería válida.']);
            exit();
        }

        $stmtBarberia = $pdo->prepare("
            SELECT id_barberia
            FROM barberias
            WHERE id_barberia = :id_barberia AND estado = 'ACTIVA'
            LIMIT 1
        ");
        $stmtBarberia->execute([':id_barberia' => $idBarberia]);
        if (!$stmtBarberia->fetchColumn()) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'La barbería seleccionada no existe o está inactiva.']);
            exit();
        }
    }

    $stmtDuplicados = $pdo->prepare("
        SELECT documento, correo
        FROM usuarios
        WHERE documento = :documento OR correo = :correo
        LIMIT 1
    ");
    $stmtDuplicados->execute([
        ':documento' => $documento,
        ':correo' => $correo,
    ]);
    $duplicado = $stmtDuplicados->fetch();
    if ($duplicado) {
        $documentoDuplicado = $duplicado['documento'] === $documento;
        $correoDuplicado = $duplicado['correo'] === $correo;
        $mensaje = $documentoDuplicado && $correoDuplicado
            ? 'El documento y el correo ya están registrados.'
            : ($documentoDuplicado
                ? 'El documento ya está registrado.'
                : 'El correo ya está registrado.');
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => $mensaje]);
        exit();
    }

    // El documento es solo la contraseña inicial: no es secreto, así que en su primer
    // ingreso el usuario debe cambiarla antes de entrar (debe_cambiar_contrasena = 1).
    $passwordHash = password_hash($documento, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("
        INSERT INTO usuarios
            (id_barberia, documento, nombre_completo, telefono, correo, password, rol, estado, debe_cambiar_contrasena)
        VALUES
            (:id_barberia, :documento, :nombre_completo, :telefono, :correo, :password, :rol, 'ACTIVO', 1)
    ");
    $stmt->execute([
        ':id_barberia' => $idBarberia,
        ':documento' => $documento,
        ':nombre_completo' => $nombre,
        ':telefono' => $telefono,
        ':correo' => $correo,
        ':password' => $passwordHash,
        ':rol' => $rolSolicitado,
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Usuario registrado. Su contraseña inicial es su documento y deberá cambiarla en su primer ingreso.',
        'id_usuario' => (int) $pdo->lastInsertId(),
    ]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El documento o el correo ya están registrados.']);
        exit();
    }

    error_log('Error al registrar un usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo registrar el usuario.']);
} catch (Throwable $error) {
    error_log('Error al registrar un usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo registrar el usuario.']);
}
