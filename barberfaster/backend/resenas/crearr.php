<?php
// backend/resenas/crearr.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_cita      = $data['id_cita'] ?? null;
$calificacion = $data['calificacion'] ?? null; // Número entero de 1 a 5
$comentario   = $data['comentario'] ?? null;

if (!$id_cita || !$calificacion) {
    echo json_encode(["status" => "error", "mensaje" => "El ID de la cita y la calificación son obligatorios."]);
    exit();
}

if ($calificacion < 1 || $calificacion > 5) {
    echo json_encode(["status" => "error", "mensaje" => "La calificación debe estar entre 1 y 5 estrellas."]);
    exit();
}

try {
    // Verificar que la cita existe y está COMPLETADA
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

    // Guardar la reseña en las notas de la cita
    $resenaTexto = "[Calificación: $calificacion/5] " . ($comentario ? $comentario : "");
    $stmt = $pdo->prepare("UPDATE citas SET notas = ? WHERE id_cita = ?");
    $stmt->execute([$resenaTexto, $id_cita]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Reseña guardada exitosamente."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar la reseña: " . $e->getMessage()]);
}