<?php
// backend/citas/completar.php
// Este archivo marca una cita como COMPLETADA cuando ya fue atendida.

// Permite que el frontend pueda consumir esta API desde otro origen.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a peticiones OPTIONS para validar CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON enviado desde el frontend.
$data = json_decode(file_get_contents("php://input"), true);
$id_cita = $data['id_cita'] ?? null;

// Validación: se requiere el ID de la cita.
if (!$id_cita) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la cita es obligatorio."]);
    exit();
}

try {
    // Cambia el estado de la cita a COMPLETADA.
    $stmt = $pdo->prepare("UPDATE citas SET estado = 'COMPLETADA' WHERE id_cita = ?");
    $stmt->execute([$id_cita]);

    // Respuesta de éxito.
    echo json_encode([
        "status" => "success",
        "mensaje" => "La cita ha sido marcada como completada."
    ]);
} catch (Exception $e) {
    // Si falla, devuelve el error en JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al completar la cita: " . $e->getMessage()]);
}