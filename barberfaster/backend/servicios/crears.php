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
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
        exit();
    }

    $idBarberia = $usuario['rol'] === 'ADMINISTRADOR'
        ? $usuario['id_barberia']
        : filter_var($data['id_barberia'] ?? null, FILTER_VALIDATE_INT);
    $nombre = trim((string) ($data['nombre'] ?? ''));
    $descripcion = trim((string) ($data['descripcion'] ?? ''));
    $duracion = filter_var($data['duracion_minutos'] ?? 30, FILTER_VALIDATE_INT);
    $precio = filter_var($data['precio'] ?? null, FILTER_VALIDATE_FLOAT);

    if (
        !$idBarberia
        || $idBarberia < 1
        || $nombre === ''
        || strlen($nombre) > 100
        || strlen($descripcion) > 2000
        || !$duracion
        || $duracion < 1
        || $duracion > 1440
        || $precio === false
        || $precio <= 0
    ) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'mensaje' => 'Revisa los datos del servicio ingresados.']);
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
        echo json_encode(['status' => 'error', 'mensaje' => 'La barbería no existe o está inactiva.']);
        exit();
    }

    $stmt = $pdo->prepare("
        INSERT INTO servicios (id_barberia, nombre, descripcion, duracion_minutos, precio, estado)
        VALUES (:id_barberia, :nombre, :descripcion, :duracion, :precio, 'ACTIVO')
    ");
    $stmt->execute([
        ':id_barberia' => $idBarberia,
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':duracion' => $duracion,
        ':precio' => $precio,
    ]);

    echo json_encode([
        'status' => 'success',
        'mensaje' => 'Servicio registrado correctamente.',
        'id_servicio' => (int) $pdo->lastInsertId(),
    ]);
} catch (Throwable $error) {
    error_log('Error al registrar un servicio: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo registrar el servicio.']);
}
