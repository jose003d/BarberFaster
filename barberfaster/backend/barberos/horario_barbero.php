<?php
// backend/barberos/horario_barbero.php
// Este archivo guarda el horario semanal de un barbero para un día específico.
// Se usa para definir en qué rango de horas trabaja cada barbero en cada día.

// Permite peticiones desde el frontend (CORS).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Responde a una petición OPTIONS para evitar errores de CORS en navegador.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Lee el JSON enviado desde el frontend en el body de la petición.
$data = json_decode(file_get_contents("php://input"), true);

// Extrae los datos del horario del barbero.
$id_barbero  = $data['id_barbero'] ?? null;
$dia_semana  = $data['dia_semana'] ?? null;  // LUNES, MARTES, etc.
$hora_inicio = $data['hora_inicio'] ?? null;  // HH:MM:SS
$hora_fin    = $data['hora_fin'] ?? null;     // HH:MM:SS

// Valida que todos los campos del horario lleguen completos.
if (!$id_barbero || !$dia_semana || !$hora_inicio || !$hora_fin) {
    echo json_encode(["status" => "error", "mensaje" => "Todos los campos del horario son obligatorios."]);
    exit();
}

try {
    // Inserta el horario para ese dia del barbero.
    // Si ya existe un registro para ese barbero y ese día, lo actualiza.
    $stmt = $pdo->prepare("
        INSERT INTO barbero_horarios (id_barbero, dia_semana, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            hora_inicio = VALUES(hora_inicio),
            hora_fin = VALUES(hora_fin)
    ");
    $stmt->execute([$id_barbero, strtoupper($dia_semana), $hora_inicio, $hora_fin]);

    // Si todo sale bien, devuelve éxito.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Horario del barbero actualizado correctamente."
    ]);
} catch (Exception $e) {
    // Si falla, devuelve el error.
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar horario: " . $e->getMessage()]);
}