<?php
// backend/citas/completar.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$id_cita = $data['id_cita'] ?? null;

if (!$id_cita) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la cita es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE citas SET estado = 'COMPLETADA' WHERE id_cita = ?");
    $stmt->execute([$id_cita]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "La cita ha sido marcada como completada."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al completar la cita: " . $e->getMessage()]);
}