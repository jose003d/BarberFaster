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

    if (empty($data['id_barberia'])) {
        echo json_encode(["success" => false, "error" => "ID requerido"]);
        exit;
    }

    // ==========================
    // BLOQUE 3: Actualización del estado de la barbería
    // ==========================
    $sql = "UPDATE barberias 
            SET estado = IF(estado = 1, 0, 1) 
            WHERE id_barberia = :id_barberia";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([":id_barberia" => $data['id_barberia']]);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    echo json_encode(["success" => true, "message" => "Estado actualizado"]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 5: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
