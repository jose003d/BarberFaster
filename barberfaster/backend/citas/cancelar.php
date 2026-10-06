<?php
// backend/citas/cancelar.php
// Este archivo cambia el estado de una cita a CANCELADA.
// Se usa cuando un cliente o administrador cancela una cita agendada.

// Permite que el frontend pueda consumir esta API desde otro origen.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a peticiones OPTIONS para permitir CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON enviado desde el frontend.
$data = json_decode(file_get_contents("php://input"), true);
$id_cita = $data['id_cita'] ?? null;

// Valida que el ID de la cita sea obligatorio.
if (!$id_cita) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la cita es obligatorio."]);
    exit();
}

try {
    // Actualiza el estado de la cita a CANCELADA.
    $stmt = $pdo->prepare("UPDATE citas SET estado = 'CANCELADA' WHERE id_cita = ?");
    $stmt->execute([$id_cita]);

    // Responde con éxito.
    echo json_encode([
        "status" => "success",
        "mensaje" => "La cita ha sido cancelada correctamente."
    ]);
} catch (Exception $e) {
    // Si falla, retorna el error en JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al cancelar la cita: " . $e->getMessage()]);
}