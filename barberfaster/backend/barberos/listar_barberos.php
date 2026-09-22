<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ... resto de tu código PHP

require_once '../config/database.php';

// Capturamos el id_barberia de forma flexible (GET, POST o por defecto 1)
$id_barberia = $_GET['id_barberia'] ?? $_POST['id_barberia'] ?? 1;

try {
    $stmt = $pdo->prepare("
        SELECT id_barbero, id_barberia, nombre, especialidad, estado 
        FROM barberos 
        WHERE id_barberia = ? AND estado = 'ACTIVO'
    ");
    $stmt->execute([$id_barberia]);
    $barberos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($barberos);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al listar barberos: " . $e->getMessage()
    ]);
}