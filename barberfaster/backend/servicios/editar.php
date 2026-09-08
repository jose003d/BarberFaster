<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $idServicio = (int) ($data['id_servicio'] ?? 0);
    $nombre = trim((string) ($data['nombre'] ?? ''));
    $precio = $data['precio'] ?? null;
    $duracion = (int) ($data['duracion_minutos'] ?? 0);

    if (!$idServicio || $nombre === '' || !is_numeric($precio) || $duracion < 1) {
        echo json_encode(["success" => false, "error" => "Completa los datos del servicio"]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE servicios SET nombre = :nombre, precio = :precio, duracion_minutos = :duracion WHERE id_servicio = :id_servicio");
    $stmt->execute([
        ':nombre' => $nombre,
        ':precio' => (float) $precio,
        ':duracion' => $duracion,
        ':id_servicio' => $idServicio,
    ]);

    echo json_encode(["success" => true, "message" => "Servicio actualizado"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
