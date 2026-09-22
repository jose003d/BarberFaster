<?php
// backend/usuarios/listaru.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barberia = $_GET['id_barberia'] ?? null;

if (!$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la barbería es obligatorio."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT id_barbero AS id_usuario, nombre, especialidad, estado 
        FROM barberos 
        WHERE id_barberia = ?
        ORDER BY nombre ASC
    ");
    $stmt->execute([$id_barberia]);
    $usuarios = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "datos" => $usuarios
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al listar usuarios: " . $e->getMessage()]);
}