<?php
// backend/servicios/editars.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_servicio      = $data['id_servicio'] ?? null;
$nombre           = $data['nombre'] ?? null;
$descripcion      = $data['descripcion'] ?? null;
$duracion_minutos = $data['duracion_minutos'] ?? 30;
$precio           = $data['precio'] ?? null;

if (!$id_servicio || !$nombre || !$precio) {
    echo json_encode(["status" => "error", "mensaje" => "El ID del servicio, nombre y precio son requeridos."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE servicios 
        SET nombre = ?, descripcion = ?, duracion_minutos = ?, precio = ? 
        WHERE id_servicio = ?
    ");
    $stmt->execute([$nombre, $descripcion, $duracion_minutos, $precio, $id_servicio]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Servicio actualizado correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al actualizar servicio: " . $e->getMessage()]);
}