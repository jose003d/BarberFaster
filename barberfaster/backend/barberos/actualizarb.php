<?php
// backend/barberos/actualizarb.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barbero   = $data['id_barbero'] ?? null;
$nombre       = $data['nombre'] ?? null;
$especialidad = $data['especialidad'] ?? null;

if (!$id_barbero || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "ID y nombre del barbero son requeridos."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE barberos SET nombre = ?, especialidad = ? WHERE id_barbero = ?");
    $stmt->execute([$nombre, $especialidad, $id_barbero]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Datos del barbero actualizados correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al actualizar barbero: " . $e->getMessage()]);
}