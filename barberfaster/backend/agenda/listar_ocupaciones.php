<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$id_barbero = filter_input(INPUT_GET, 'id_barbero', FILTER_VALIDATE_INT);
$fecha = $_GET['fecha'] ?? '';
$fechaValidada = is_string($fecha) ? DateTime::createFromFormat('!Y-m-d', $fecha) : false;

if (!$id_barbero || !$fechaValidada || $fechaValidada->format('Y-m-d') !== $fecha) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Se requiere un ID de barbero y una fecha válida (YYYY-MM-DD)."
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT hora_inicio, hora_fin
        FROM citas
        WHERE id_barbero = :id_barbero
          AND fecha = :fecha
          AND estado NOT IN ('CANCELADA', 'cancelada')
        ORDER BY hora_inicio ASC
    ");
    $stmt->execute([
        ':id_barbero' => $id_barbero,
        ':fecha' => $fecha,
    ]);

    echo json_encode([
        "status" => "success",
        "datos" => $stmt->fetchAll()
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al consultar las ocupaciones del barbero."
    ]);
}
