<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// ==========================
// BLOQUE 2: Conexión a la base de datos
// ==========================
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 3: Consulta de clientes
    // ==========================
    $sql = "SELECT dni, nombre, apellido, telefono, correo, estado 
            FROM clientes 
            ORDER BY dni DESC";

    $stmt = $pdo->query($sql);
    $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    echo json_encode([
        "success"  => true,
        "clientes" => $clientes
    ]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 5: Manejo de errores
    // ==========================
    echo json_encode([
        "success" => false, 
        "error"   => $e->getMessage()
    ]);
}
