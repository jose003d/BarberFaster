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
    $data = json_decode(file_get_contents("php://input"), true);

    $id_barbero  = $data['id_barbero']  ?? null;
    $id_barberia = $data['id_barberia'] ?? null;
    $start       = $data['start']       ?? null;
    $end         = $data['end']         ?? null;

    // Validación de campos obligatorios
    if (!$id_barbero || !$id_barberia || !$start || !$end) {
        echo json_encode(["success" => false, "error" => "Faltan datos"]);
        exit;
    }

    // ==========================
    // BLOQUE 3: Inserción del evento disponible
    // ==========================
    $stmt = $pdo->prepare("
        INSERT INTO eventos (
            titulo, start_datetime, end_datetime, disponible, tipo, color, id_barbero, id_barberia
        ) VALUES (
            'Disponible', :start, :end, 1, 'DISPONIBLE', '#16a34a', :id_barbero, :id_barberia
        )
    ");
    $stmt->execute([
        ':start'      => $start, 
        ':end'        => $end, 
        ':id_barbero' => $id_barbero, 
        ':id_barberia'=> $id_barberia
    ]);

    // ==========================
    // BLOQUE 4: Respuesta final
    // ==========================
    echo json_encode(["success" => true]);

} catch (Exception $e) {
    // Manejo de errores
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
