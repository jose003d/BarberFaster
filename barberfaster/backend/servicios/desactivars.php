<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    if (empty($data['id_servicio'])) {
        echo json_encode(["success" => false, "error" => "Falta el id del servicio"]);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE servicios SET activo = IF(activo = 1, 0, 1) WHERE id_servicio = :id");
    $stmt->execute([':id' => (int) $data['id_servicio']]);
    echo json_encode(["success" => true, "message" => "Estado actualizado"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
