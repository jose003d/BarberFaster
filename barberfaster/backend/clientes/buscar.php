<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ==========================
// BLOQUE 2: Conexión a la base de datos
// ==========================
require_once "../config/database.php";

// ==========================
// BLOQUE 3: Validación de parámetros de entrada
// ==========================
$dni = $_GET['dni'] ?? null;

if ($dni === null || $dni === '') {
    echo json_encode(["success" => false, "error" => "No se recibió el documento"]);
    exit;
}

try {
    // ==========================
    // BLOQUE 4: Consulta de cliente por DNI
    // ==========================
    $stmt = $pdo->prepare("
        SELECT dni, nombre, apellido, telefono, correo, estado 
        FROM clientes 
        WHERE dni = :dni 
        LIMIT 1
    ");
    $stmt->execute([":dni" => (string)$dni]);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($cliente) {
        $cliente['id_cliente'] = (string) $cliente['dni'];
    }

    // ==========================
    // BLOQUE 5: Respuesta en formato JSON
    // ==========================
    if ($cliente) {
        echo json_encode(["success" => true, "cliente" => $cliente]);
    } else {
        echo json_encode(["success" => false, "cliente" => null]);
    }

} catch (Exception $e) {
    // ==========================
    // BLOQUE 6: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
