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
    $usuario = requerirRol($pdo, ['ADMINISTRADOR', 'SUPERADMIN']);
    $data = json_decode(file_get_contents('php://input'), true);
    $idServicio = filter_var(
        is_array($data) ? ($data['id_servicio'] ?? null) : null,
        FILTER_VALIDATE_INT
    );
    $nombre = trim((string) ($data['nombre'] ?? ''));
    $descripcion = trim((string) ($data['descripcion'] ?? ''));
    $duracion = filter_var($data['duracion_minutos'] ?? 30, FILTER_VALIDATE_INT);
    $precio = filter_var($data['precio'] ?? null, FILTER_VALIDATE_FLOAT);

    if (
        !$idServicio
        || $idServicio < 1
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

    $stmtActual = $pdo->prepare('SELECT id_barberia FROM servicios WHERE id_servicio = :id_servicio LIMIT 1');
    $stmtActual->execute([':id_servicio' => $idServicio]);
    $idBarberiaActual = $stmtActual->fetchColumn();
    if (
        $idBarberiaActual === false
        || ($usuario['rol'] === 'ADMINISTRADOR'
            && (int) $idBarberiaActual !== $usuario['id_barberia'])
    ) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró el servicio de esa barbería.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE servicios
        SET nombre = :nombre,
            descripcion = :descripcion,
            duracion_minutos = :duracion,
            precio = :precio
        WHERE id_servicio = :id_servicio
    ");
    $stmt->execute([
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':duracion' => $duracion,
        ':precio' => $precio,
        ':id_servicio' => $idServicio,
    ]);

    echo json_encode(['status' => 'success', 'mensaje' => 'Servicio actualizado correctamente.']);
} catch (Throwable $error) {
    error_log('Error al actualizar un servicio: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el servicio.']);
}
