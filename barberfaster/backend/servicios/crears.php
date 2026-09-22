<?php
// backend/servicios/crears.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

$id_barberia      = $data['id_barberia'] ?? null;
$nombre           = $data['nombre'] ?? null;
$descripcion      = $data['descripcion'] ?? '';
$duracion_minutos = $data['duracion_minutos'] ?? 30;
$precio           = $data['precio'] ?? null;

// Validamos únicamente las propiedades generales del catálogo
if (!$id_barberia || !$nombre || $precio === null) {
    echo json_encode([
        "status" => "error", 
        "mensaje" => "El ID de la barbería, el nombre y el precio son obligatorios."
    ]);
    exit();
}

try {
    // Se elimina 'id_barbero' de la lista de columnas
    $stmt = $pdo->prepare("
        INSERT INTO servicios (id_barberia, nombre, descripcion, duracion_minutos, precio, estado)
        VALUES (?, ?, ?, ?, ?, 'ACTIVO')
    ");
    $stmt->execute([$id_barberia, $nombre, $descripcion, $duracion_minutos, $precio]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Servicio registrado correctamente en el catálogo.",
        "id_servicio" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "mensaje" => "Error al registrar servicio: " . $e->getMessage()
    ]);
}
?>