<?php
// backend/barberos/eliminarb.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barbero = $data['id_barbero'] ?? null;
$estado     = $data['estado'] ?? 'INACTIVO'; // ACTIVO o INACTIVO

if (!$id_barbero) {
    echo json_encode(["status" => "error", "mensaje" => "El ID del barbero es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE barberos SET estado = ? WHERE id_barbero = ?");
    $stmt->execute([$estado, $id_barbero]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Estado del barbero actualizado a " . $estado
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al cambiar estado del barbero: " . $e->getMessage()]);
}