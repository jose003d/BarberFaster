<?php
// backend/clientes/buscar.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$dni = isset($_GET['dni']) && is_string($_GET['dni']) ? trim($_GET['dni']) : '';

if (!preg_match('/^\d{1,10}$/', $dni)) {
    http_response_code(422);
    echo json_encode(["status" => "error", "mensaje" => "El DNI debe tener máximo 10 dígitos."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT dni, nombre, telefono FROM clientes WHERE dni = ?");
    $stmt->execute([$dni]);
    $cliente = $stmt->fetch();

    if ($cliente) {
        echo json_encode([
            "status" => "success",
            "encontrado" => true,
            "datos" => $cliente
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "encontrado" => false,
            "mensaje" => "Cliente no registrado."
        ]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al buscar cliente: " . $e->getMessage()]);
}