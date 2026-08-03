<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
// Permitir conexiones desde tu frontend en React
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
    // BLOQUE 3: Consulta de barberías
    // ==========================
    $stmt = $pdo->query("SELECT * FROM barberias ORDER BY id_barberia DESC");
    $barberias = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    echo json_encode([
        "success"   => true,
        "barberias" => $barberias
    ]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 5: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
