<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y CORS
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
// BLOQUE 3: Recepción y validación de datos
// ==========================
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "No se recibieron datos del cliente"]);
    exit;
}

try {
    // ==========================
    // BLOQUE 4: Inserción en la base de datos
    // ==========================
    $sql = "INSERT INTO clientes (dni, nombre, apellido, telefono, correo) 
            VALUES (:dni, :nombre, :apellido, :telefono, :correo)";
    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':dni'      => !empty($data['dni'])      ? intval($data['dni']) : null,
        ':nombre'   => !empty($data['nombre'])   ? $data['nombre']      : null,
        ':apellido' => !empty($data['apellido']) ? $data['apellido']    : null,
        ':telefono' => !empty($data['telefono']) ? $data['telefono']    : null,
        ':correo'   => !empty($data['correo'])   ? $data['correo']      : null,
    ]);

    // ==========================
    // BLOQUE 5: Respuesta en formato JSON
    // ==========================
    echo json_encode([
        "success" => true,
        "mensaje" => "Cliente registrado con éxito"
    ]);

} catch (PDOException $e) {
    // ==========================
    // BLOQUE 6: Manejo de errores
    // ==========================
    echo json_encode([
        "success" => false,
        "error"   => "Error SQL en clientes: " . $e->getMessage()
    ]);
    exit;
}
