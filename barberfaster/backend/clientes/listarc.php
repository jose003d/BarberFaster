<?php
// backend/clientes/listarc.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

try {
    $stmt = $pdo->query("SELECT dni, nombre, telefono, email FROM clientes ORDER BY nombre ASC");
    $clientes = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "datos" => $clientes
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al listar clientes: " . $e->getMessage()]);
}