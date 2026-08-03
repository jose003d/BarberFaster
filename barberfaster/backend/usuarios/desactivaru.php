<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id_usuario'])) {
        echo json_encode(["success" => false, "error" => "ID requerido"]);
        exit;
    }

    $sql = "UPDATE Usuarios SET estado = IF(estado = 1, 0, 1) WHERE id_usuario = :id_usuario";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([":id_usuario" => $data['id_usuario']]);

    echo json_encode(["success" => true, "message" => "Estado actualizado"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
