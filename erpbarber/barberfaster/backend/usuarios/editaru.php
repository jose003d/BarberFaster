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
    $idUsuario = filter_var($data['id_usuario'] ?? null, FILTER_VALIDATE_INT);
    $nombre = trim((string) ($data['nombre_completo'] ?? $data['nombre'] ?? ''));
    $telefono = trim((string) ($data['telefono'] ?? ''));
    $correo = trim((string) ($data['correo'] ?? $data['email'] ?? ''));

    if (
        !is_array($data)
        || !$idUsuario
        || $idUsuario < 1
        || $nombre === ''
        || strlen($nombre) > 150
        || strlen($telefono) > 20
        || $correo === ''
        || strlen($correo) > 120
        || !filter_var($correo, FILTER_VALIDATE_EMAIL)
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos del usuario ingresados.']);
        exit();
    }

    $stmtActual = $pdo->prepare("
        SELECT id_usuario, id_barberia, rol
        FROM usuarios
        WHERE id_usuario = :id_usuario
        LIMIT 1
    ");
    $stmtActual->execute([':id_usuario' => $idUsuario]);
    $usuarioActual = $stmtActual->fetch();
    if (
        !$usuarioActual
        || !in_array($usuarioActual['rol'], ['BARBERO', 'ADMINISTRADOR'], true)
        || ($sesion['rol'] === 'ADMINISTRADOR'
            && (
                $usuarioActual['rol'] !== 'BARBERO'
                || (int) $usuarioActual['id_barberia'] !== $sesion['id_barberia']
            ))
    ) {
        responderErrorAuth(404, 'No se encontró el usuario que deseas editar.');
    }

    $stmtDuplicado = $pdo->prepare("
        SELECT id_usuario
        FROM usuarios
        WHERE correo = :correo AND id_usuario <> :id_usuario
        LIMIT 1
    ");
    $stmtDuplicado->execute([
        ':correo' => $correo,
        ':id_usuario' => $idUsuario,
    ]);
    if ($stmtDuplicado->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El correo ya está registrado.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET nombre_completo = :nombre_completo,
            telefono = :telefono,
            correo = :correo
        WHERE id_usuario = :id_usuario
    ");
    $stmt->execute([
        ':nombre_completo' => $nombre,
        ':telefono' => $telefono,
        ':correo' => $correo,
        ':id_usuario' => $idUsuario,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Usuario actualizado correctamente.']);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El correo ya está registrado.']);
        exit();
    }

    error_log('Error al actualizar un usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el usuario.']);
} catch (Throwable $error) {
    error_log('Error al actualizar un usuario: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el usuario.']);
}
