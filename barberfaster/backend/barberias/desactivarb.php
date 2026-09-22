<?php
// backend/barberias/desactivarb.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barberia = $data['id_barberia'] ?? null;
$estado      = $data['estado'] ?? 'INACTIVA'; // ACTIVA o INACTIVA

if (!$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la barbería es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE barberias SET estado = ? WHERE id_barberia = ?");
    $stmt->execute([$estado, $id_barberia]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Estado de la barbería actualizado a " . $estado
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al actualizar estado: " . $e->getMessage()]);
}