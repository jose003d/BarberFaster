<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";
$data = json_decode(file_get_contents("php://input"), true) ?: [];
$idCita = (int) ($data['id_cita'] ?? 0);
if (!$idCita) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'id_cita es obligatorio']); exit; }
$stmt = $pdo->prepare("UPDATE citas SET estado = 'COMPLETADA' WHERE id_cita = :cita AND estado IN ('PENDIENTE', 'CONFIRMADA')");
$stmt->execute([':cita' => $idCita]);
echo json_encode(['success' => $stmt->rowCount() === 1]);
