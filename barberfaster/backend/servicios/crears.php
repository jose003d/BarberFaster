<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    if (empty($data['id_barberia']) || empty(trim($data['nombre'])) || !isset($data['precio']) || !isset($data['duracion_minutos'])) {
        echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO servicios (id_barberia, nombre, precio, duracion_minutos, activo) VALUES (:barberia, :nombre, :precio, :duracion, 1)");
    $stmt->execute([
        ':barberia' => (int) $data['id_barberia'],
        ':nombre' => trim($data['nombre']),
        ':precio' => (float) $data['precio'],
        ':duracion' => (int) $data['duracion_minutos'],
    ]);
    echo json_encode(["success" => true, "id_servicio" => (int) $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
