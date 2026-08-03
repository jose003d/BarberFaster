<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 2: Recepción y validación de datos
    // ==========================
    $data = json_decode(file_get_contents('php://input'), true);
    $id_usuario   = $data['id_usuario']   ?? null;
    $id_barberia  = $data['id_barberia']  ?? null;
    $especialidad = $data['especialidad'] ?? '';

    if (!$id_usuario || !$id_barberia) {
        echo json_encode([
            "success" => false, 
            "error"   => "Faltan datos obligatorios (id_usuario o id_barberia)"
        ]);
        exit;
    }

    // ==========================
    // BLOQUE 3: Inserción en la base de datos
    // ==========================
    $sql = "INSERT INTO barberos (id_usuario, id_barberia, especialidad) 
            VALUES (:id_usuario, :id_barberia, :especialidad)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_usuario'   => $id_usuario,
        ':id_barberia'  => $id_barberia,
        ':especialidad' => $especialidad,
    ]);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    $id_barbero = $pdo->lastInsertId();
    echo json_encode([
        "success"    => true, 
        "id_barbero" => (int)$id_barbero
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
