<?php
// backend/barberos/horario_barbero.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$id_barbero  = $data['id_barbero'] ?? null;
$dia_semana  = $data['dia_semana'] ?? null;  // LUNES, MARTES, etc.
$hora_inicio = $data['hora_inicio'] ?? null;  // HH:MM:SS
$hora_fin    = $data['hora_fin'] ?? null;     // HH:MM:SS

if (!$id_barbero || !$dia_semana || !$hora_inicio || !$hora_fin) {
    echo json_encode(["status" => "error", "mensaje" => "Todos los campos del horario son obligatorios."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO barbero_horarios (id_barbero, dia_semana, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            hora_inicio = VALUES(hora_inicio),
            hora_fin = VALUES(hora_fin)
    ");
    $stmt->execute([$id_barbero, strtoupper($dia_semana), $hora_inicio, $hora_fin]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Horario del barbero actualizado correctamente."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar horario: " . $e->getMessage()]);
}