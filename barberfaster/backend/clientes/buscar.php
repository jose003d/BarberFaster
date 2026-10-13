<?php
// backend/clientes/buscar.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$dni = $_GET['dni'] ?? null;

if (!$dni) {
    echo json_encode(["status" => "error", "mensaje" => "El DNI es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT dni, nombre, telefono, email FROM clientes WHERE dni = ?");
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