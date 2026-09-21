<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$idServicio = (int) ($data['id_servicio'] ?? 0);
$idBarberia = (int) ($data['id_barberia'] ?? 0);
$precio = (float) ($data['precio'] ?? -1);
if (!$idServicio || !$idBarberia || $precio < 0) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Servicio, barbería y precio son obligatorios']); exit; }
$stmt = $pdo->prepare("INSERT INTO tarifas (id_servicio, id_barberia, precio) SELECT :servicio, id_barberia, :precio FROM servicios WHERE id_servicio = :servicio_check AND id_barberia = :barberia ON DUPLICATE KEY UPDATE precio = VALUES(precio)");
$stmt->execute([':servicio' => $idServicio, ':servicio_check' => $idServicio, ':barberia' => $idBarberia, ':precio' => $precio]);
echo json_encode(['success' => true]);
