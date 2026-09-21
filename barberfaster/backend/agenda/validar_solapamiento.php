<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";

$data = $_SERVER['REQUEST_METHOD'] === 'POST' ? (json_decode(file_get_contents("php://input"), true) ?: []) : $_GET;
$idBarbero = (int) ($data['id_barbero'] ?? 0);
$start = trim((string) ($data['start_datetime'] ?? ''));
$end = trim((string) ($data['end_datetime'] ?? ''));
if (!$idBarbero || !$start || !$end) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'id_barbero, start_datetime y end_datetime son obligatorios']); exit; }

$stmt = $pdo->prepare("SELECT id_evento, start_datetime, end_datetime, estado_disponibilidad FROM eventos WHERE id_barbero = :barbero AND estado_disponibilidad <> 'BLOQUEADO' AND start_datetime < :end AND end_datetime > :start ORDER BY start_datetime");
$stmt->execute([':barbero' => $idBarbero, ':start' => $start, ':end' => $end]);
$eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['success' => true, 'disponible' => count($eventos) === 0, 'solapamientos' => $eventos]);
