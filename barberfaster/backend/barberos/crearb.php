<?php
// backend/barberos/crearb.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barberia  = $data['id_barberia'] ?? null;
$nombre       = $data['nombre'] ?? null;
$especialidad = $data['especialidad'] ?? null;

if (!$id_barberia || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "El nombre del barbero y la barbería son obligatorios."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO barberos (id_barberia, nombre, especialidad, estado)
        VALUES (?, ?, ?, 'ACTIVO')
    ");
    $stmt->execute([$id_barberia, $nombre, $especialidad]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Barbero registrado correctamente.",
        "id_barbero" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al registrar barbero: " . $e->getMessage()]);
}