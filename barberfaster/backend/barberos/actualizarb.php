<?php
// backend/barberos/actualizarb.php
// Actualiza los datos personales y profesionales de un barbero.

// Permite peticiones desde el frontend (CORS).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a preflight OPTIONS para que el navegador permita la petición.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el body en JSON enviado desde el frontend.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los campos enviados.
$id_barbero   = $data['id_barbero'] ?? null;
$nombre       = $data['nombre'] ?? null;
$apellido     = $data['apellido'] ?? '';
$email        = $data['email'] ?? '';
$telefono     = $data['telefono'] ?? '';
$documento    = $data['documento'] ?? '';
$especialidad = $data['especialidad'] ?? null;

// Valida que el ID y el nombre sean obligatorios.
if (!$id_barbero || !$nombre) {
    echo json_encode(["status" => "error", "mensaje" => "ID y nombre del barbero son requeridos."]);
    exit();
}

try {
    // Persiste los campos del formulario completo en la fila del barbero.
    $stmt = $pdo->prepare("
        UPDATE barberos
        SET nombre = ?, apellido = ?, email = ?, telefono = ?, documento = ?, especialidad = ?
        WHERE id_barbero = ?
    ");
    $stmt->execute([$nombre, $apellido, $email, $telefono, $documento, $especialidad, $id_barbero]);

    // Si todo sale bien, responde con éxito.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Datos del barbero actualizados correctamente."
    ]);
} catch (Throwable $e) {
    error_log('Error al actualizar los datos del barbero: ' . $e->getMessage());
    http_response_code(500);
    // Si falla la actualización, devuelve el error.
    echo json_encode(["status" => "error", "mensaje" => "Error al actualizar los datos del barbero."]);
}