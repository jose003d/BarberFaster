<?php
// backend/barberos/eliminarb.php
// Este archivo cambia el estado de un barbero (ACTIVO/INACTIVO).
// En la práctica funciona como una eliminación lógica, no física.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a la solicitud OPTIONS para evitar errores de CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON enviado desde el frontend.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae el ID del barbero y el nuevo estado.
$id_barbero = $data['id_barbero'] ?? null;
$estado     = $data['estado'] ?? 'INACTIVO'; // ACTIVO o INACTIVO

// Validación: el ID es obligatorio.
if (!$id_barbero) {
    echo json_encode(["status" => "error", "mensaje" => "El ID del barbero es obligatorio."]);
    exit();
}

try {
    // Actualiza únicamente el estado del barbero en la tabla.
    $stmt = $pdo->prepare("UPDATE barberos SET estado = ? WHERE id_barbero = ?");
    $stmt->execute([$estado, $id_barbero]);

    // Devuelve mensaje con el nuevo estado.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Estado del barbero actualizado a " . $estado
    ]);
} catch (Exception $e) {
    // Si falla, retorna el error.
    echo json_encode(["status" => "error", "mensaje" => "Error al cambiar estado del barbero: " . $e->getMessage()]);
}