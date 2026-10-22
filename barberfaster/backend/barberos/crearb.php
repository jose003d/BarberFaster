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
$apellido     = $data['apellido'] ?? '';
$email        = $data['email'] ?? '';
$telefono     = $data['telefono'] ?? '';
$documento    = $data['documento'] ?? '';
$especialidad = $data['especialidad'] ?? null;

// Valida que la barbería y el nombre sean obligatorios.
if (!$id_barberia || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "El nombre del barbero y la barbería son obligatorios."]);
    exit();
}

try {
    // Guarda los datos personales y profesionales del nuevo barbero.
    $stmt = $pdo->prepare("
        INSERT INTO barberos (id_barberia, nombre, apellido, email, telefono, documento, especialidad, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
    ");
    $stmt->execute([$id_barberia, $nombre, $apellido, $email, $telefono, $documento, $especialidad]);

    // Devuelve respuesta de éxito y el ID generado.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Barbero registrado correctamente.",
        "id_barbero" => $pdo->lastInsertId()
    ]);
} catch (Throwable $e) {
    error_log('Error al registrar los datos del barbero: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "Error al registrar los datos del barbero."]);
}