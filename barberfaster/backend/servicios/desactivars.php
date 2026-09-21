<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json"); require_once "../config/database.php";
$data = json_decode(file_get_contents("php://input"), true) ?: []; $id = (int) ($data['id_servicio'] ?? 0); if (!$id) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Falta el id del servicio']); exit; }
$stmt = $pdo->prepare("UPDATE servicios SET estado = IF(estado = 1, 0, 1) WHERE id_servicio = :id"); $stmt->execute([':id' => $id]); echo json_encode(['success' => true]);
