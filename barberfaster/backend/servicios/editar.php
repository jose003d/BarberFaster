<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json"); require_once "../config/database.php";
$data = json_decode(file_get_contents("php://input"), true) ?: []; $id = (int) ($data['id_servicio'] ?? 0); $nombre = trim((string) ($data['nombre'] ?? '')); $duracion = (int) ($data['duracion_estimada'] ?? $data['duracion_minutos'] ?? 0); $precio = (float) ($data['precio'] ?? -1);
if (!$id || !$nombre || $duracion < 1 || $precio < 0) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Completa los datos del servicio']); exit; }
$stmt = $pdo->prepare("UPDATE servicios s INNER JOIN tarifas t ON t.id_servicio = s.id_servicio SET s.nombre = :nombre, s.duracion_estimada = :duracion, t.precio = :precio WHERE s.id_servicio = :id"); $stmt->execute([':nombre' => $nombre, ':duracion' => $duracion, ':precio' => $precio, ':id' => $id]); echo json_encode(['success' => true]);
