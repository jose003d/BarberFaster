<?php
// backend/barberias/crearb.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$nombre    = $data['nombre'] ?? null;
$direccion = $data['direccion'] ?? null;
$ciudad    = $data['ciudad'] ?? null;
$telefono  = $data['telefono'] ?? null;
$foto      = $data['foto'] ?? null;

if (!$nombre || !$direccion || !$ciudad || !$telefono) {
    echo json_encode(["status" => "error", "mensaje" => "Nombre, dirección, ciudad y teléfono son obligatorios."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO barberias (nombre, direccion, ciudad, telefono, foto, estado)
        VALUES (?, ?, ?, ?, ?, 'ACTIVA')
    ");
    $stmt->execute([$nombre, $direccion, $ciudad, $telefono, $foto]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Barbería registrada correctamente.",
        "id_barberia" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al crear barbería: " . $e->getMessage()]);
}