<?php
// backend/usuarios/listaru.php
// Este archivo lista los usuarios/barberos asociados a una barbería específica.
// Se usa para mostrar empleados o barberos en el frontend.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Lee el id_barberia desde la URL, por ejemplo: ?id_barberia=1
$id_barberia = $_GET['id_barberia'] ?? null;

// Valida que el ID de la barbería venga en la petición.
if (!$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la barbería es obligatorio."]);
    exit();
}

try {
    // Consulta los barberos pertenecientes a esa barbería.
    $stmt = $pdo->prepare("
        SELECT id_barbero AS id_usuario, nombre, especialidad, estado 
        FROM barberos 
        WHERE id_barberia = ?
        ORDER BY nombre ASC
    ");
    $stmt->execute([$id_barberia]);
    $usuarios = $stmt->fetchAll();

    // Devuelve la lista como JSON.
    echo json_encode([
        "status" => "success",
        "datos" => $usuarios
    ]);
} catch (Exception $e) {
    // Si hay error, lo devuelve en JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al listar usuarios: " . $e->getMessage()]);
}