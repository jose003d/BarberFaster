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
    if (empty($data['nombre'])) {
        echo json_encode(["success" => false, "error" => "El nombre es obligatorio"]);
        exit;
    }

    // ==========================
    // BLOQUE 3: Actualización de datos en la base
    // ==========================
    $sql = "UPDATE barberias SET
                nombre    = :nombre,
                direccion = :direccion,
                ciudad    = :ciudad,
                telefono  = :telefono,
                estado    = :estado
            WHERE id_barberia = :id_barberia";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_barberia' => $data['id_barberia'],
        ':nombre'      => $data['nombre'],
        ':direccion'   => $data['direccion'] ?? '',
        ':ciudad'      => $data['ciudad']    ?? '',
        ':telefono'    => $data['telefono']  ?? '',
        ':estado'      => $data['estado']    ?? 1,
    ]);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    echo json_encode(["success" => true, "message" => "Barbería actualizada"]);

} catch (Exception $e) {
    // ==========================
    // BLOQUE 5: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
