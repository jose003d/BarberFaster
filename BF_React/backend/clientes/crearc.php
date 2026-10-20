<?php
// backend/clientes/crearc.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$dni      = $data['dni'] ?? null;
$nombre   = $data['nombre'] ?? null;
$telefono = $data['telefono'] ?? null;
$email    = $data['email'] ?? null;

if (!$dni || !$nombre || !$telefono) {
    echo json_encode(["status" => "error", "mensaje" => "DNI, nombre y teléfono son obligatorios."]);
    exit();
}

try {
    // Registra o actualiza los datos si el DNI ya existía
    $stmt = $pdo->prepare("
        INSERT INTO clientes (dni, nombre, telefono, email)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            nombre = VALUES(nombre),
            telefono = VALUES(telefono),
            email = VALUES(email)
    ");
    $stmt->execute([$dni, $nombre, $telefono, $email]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Cliente guardado correctamente.",
        "dni" => $dni
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar cliente: " . $e->getMessage()]);
}