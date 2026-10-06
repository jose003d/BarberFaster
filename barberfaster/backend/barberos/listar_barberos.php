<?php
// Este archivo devuelve los barberos activos de una barbería específica.
// Se usa para cargar la lista de barberos en el frontend.

// Permite peticiones desde cualquier origen del frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Responde a peticiones OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a la base de datos.
require_once '../config/database.php';

// Captura el id_barberia de forma flexible: GET, POST o por defecto 1.
$id_barberia = $_GET['id_barberia'] ?? $_POST['id_barberia'] ?? 1;

try {
    // Consulta solo los barberos activos de la barbería seleccionada.
    $stmt = $pdo->prepare("
        SELECT id_barbero, id_barberia, nombre, especialidad, estado 
        FROM barberos 
        WHERE id_barberia = ? AND estado = 'ACTIVO'
    ");
    $stmt->execute([$id_barberia]);
    $barberos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Devuelve la lista de barberos como JSON.
    echo json_encode($barberos);

} catch (Exception $e) {
    // En caso de error, devuelve un JSON con el mensaje.
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al listar barberos: " . $e->getMessage()
    ]);
}