<?php
// backend/servicios/desactivars.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_servicio = $data['id_servicio'] ?? null;
$estado      = $data['estado'] ?? 'INACTIVO'; // ACTIVO o INACTIVO

if (!$id_servicio) {
    echo json_encode(["status" => "error", "mensaje" => "El ID del servicio es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE servicios SET estado = ? WHERE id_servicio = ?");
    $stmt->execute([$estado, $id_servicio]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Estado del servicio actualizado a " . $estado
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al cambiar estado: " . $e->getMessage()]);
}