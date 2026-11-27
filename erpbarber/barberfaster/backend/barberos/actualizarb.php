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
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
        exit();
    }

    $idUsuario = filter_var($data['id_usuario'] ?? $data['id_barbero'] ?? null, FILTER_VALIDATE_INT);
    $nombre = trim((string) ($data['nombre_completo'] ?? trim(
        (string) ($data['nombre'] ?? '') . ' ' . (string) ($data['apellido'] ?? '')
    )));
    $correo = trim((string) ($data['correo'] ?? $data['email'] ?? ''));
    $telefono = trim((string) ($data['telefono'] ?? ''));

    if (
        !$idUsuario
        || $idUsuario < 1
        || $nombre === ''
        || strlen($nombre) > 150
        || strlen($correo) > 120
        || !filter_var($correo, FILTER_VALIDATE_EMAIL)
        || strlen($telefono) > 20
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos del barbero ingresados.']);
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

    $stmtCorreo = $pdo->prepare("
        SELECT id_usuario
        FROM usuarios
        WHERE correo = :correo AND id_usuario <> :id_usuario
        LIMIT 1
    ");
    $stmtCorreo->execute([':correo' => $correo, ':id_usuario' => $idUsuario]);
    if ($stmtCorreo->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El correo ya está registrado.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET nombre_completo = :nombre,
            correo = :correo,
            telefono = :telefono
        WHERE id_usuario = :id_usuario AND rol = 'BARBERO'
    ");
    $stmt->execute([
        ':nombre' => $nombre,
        ':correo' => $correo,
        ':telefono' => $telefono,
        ':id_usuario' => $idUsuario,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Datos del barbero actualizados correctamente.']);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'mensaje' => 'El correo ya está registrado.']);
        exit();
    }

    error_log('Error al actualizar un barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron actualizar los datos del barbero.']);
} catch (Throwable $error) {
    error_log('Error al actualizar un barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron actualizar los datos del barbero.']);
}
