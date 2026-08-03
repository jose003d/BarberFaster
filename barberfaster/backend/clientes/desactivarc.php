<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Respuesta inmediata para preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================
// BLOQUE 2: Conexión a la base de datos
// ==========================
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 3: Recepción y validación de datos
    // ==========================
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['dni'])) {
        echo json_encode(["success" => false, "error" => "DNI requerido"]);
        exit;
    }

    // ==========================
    // BLOQUE 4: Actualización del estado del cliente
    // ==========================
    $sql = "UPDATE clientes 
            SET estado = IF(estado = 1, 0, 1) 
            WHERE dni = :dni";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([":dni" => $data['dni']]);

    // ==========================
    // BLOQUE 5: Respuesta en formato JSON
    // ==========================
    echo json_encode(["success" => true, "message" => "Estado actualizado"]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 6: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
