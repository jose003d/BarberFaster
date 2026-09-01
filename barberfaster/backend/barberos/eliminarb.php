<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);
$id_barbero = $data["id_barbero"] ?? null;

if (!$id_barbero) {
    echo json_encode(["success" => false, "error" => "Falta el id_barbero"]);
    exit;
}

$sql = "DELETE FROM barberos WHERE id_barbero = :id_barbero";
$stmt = $pdo->prepare($sql);
$stmt->execute([":id_barbero" => $id_barbero]);

echo json_encode(["success" => true]);

?>