<?php
// backend/resenas/crearr.php
// Este archivo guarda una reseña para una cita completada.
// La calificación se guarda en el campo notas de la cita con un formato legible.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a peticiones OPTIONS antes de continuar.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON del body.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los valores enviados por el cliente.
$id_cita      = $data['id_cita'] ?? null;
$calificacion = $data['calificacion'] ?? null; // Número entero de 1 a 5
$comentario   = $data['comentario'] ?? null;

// Validación: la cita y la calificación son obligatorias.
if (!$id_cita || !$calificacion) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la cita y la calificación son obligatorios."]);
    exit();
}

// La calificación debe estar entre 1 y 5.
if ($calificacion < 1 || $calificacion > 5) {
    echo json_encode(["status" => "error", "mensaje" => "La calificación debe estar entre 1 y 5 estrellas."]);
    exit();
}

try {
    // Verifica que la cita exista y esté marcada como COMPLETADA.
    $stmtCheck = $pdo->prepare("SELECT estado FROM citas WHERE id_cita = ?");
    $stmtCheck->execute([$id_cita]);
    $cita = $stmtCheck->fetch();

    if (!$cita) {
        echo json_encode(["status" => "error", "mensaje" => "La cita especificada no existe."]);
        exit();
    }

    if ($cita['estado'] !== 'COMPLETADA') {
        echo json_encode(["status" => "error", "mensaje" => "Solo se pueden calificar citas completadas."]);
        exit();
    }

    // Prepara el texto de la reseña con la calificación y comentario.
    $resenaTexto = "[Calificación: $calificacion/5] " . ($comentario ? $comentario : "");

    // Guarda la reseña en el campo notas de la cita.
    $stmt = $pdo->prepare("UPDATE citas SET notas = ? WHERE id_cita = ?");
    $stmt->execute([$resenaTexto, $id_cita]);

    // Respuesta exitosa.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Reseña guardada exitosamente."
    ]);
} catch (Exception $e) {
    // Si ocurre un error, lo devuelve en JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar la reseña: " . $e->getMessage()]);
}