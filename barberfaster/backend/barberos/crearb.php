<?php
// backend/barberos/crearb.php
// Este archivo registra un nuevo barbero en la base de datos.

// Configura CORS para permitir peticiones del frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Importa la conexión a la base de datos.
require_once '../config/database.php';

// Responde a las solicitudes OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el body del request JSON enviado por el frontend.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los campos requeridos.
$id_barberia  = $data['id_barberia'] ?? null;
$nombre       = $data['nombre'] ?? null;
$especialidad = $data['especialidad'] ?? null;

// Valida que la barbería y el nombre sean obligatorios.
if (!$id_barberia || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "El nombre del barbero y la barbería son obligatorios."]);
    exit();
}

try {
    // Inserta el nuevo barbero con estado ACTIVO por defecto.
    $stmt = $pdo->prepare("
        INSERT INTO barberos (id_barberia, nombre, especialidad, estado)
        VALUES (?, ?, ?, 'ACTIVO')
    ");
    $stmt->execute([$id_barberia, $nombre, $especialidad]);

    // Devuelve respuesta de éxito y el ID generado.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Barbero registrado correctamente.",
        "id_barbero" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    // Si falla la inserción, devuelve el error.
    echo json_encode(["status" => "error", "mensaje" => "Error al registrar barbero: " . $e->getMessage()]);
}