<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$dni = trim((string) ($data['dni'] ?? ''));
if (!$dni) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Falta dni']); exit; }
$cliente = $pdo->prepare("SELECT dni FROM clientes WHERE dni = :dni AND estado = 1");
$cliente->execute([':dni' => $dni]);
if (!$cliente->fetch()) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Cliente no encontrado']); exit; }
$codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$insert = $pdo->prepare("INSERT INTO validaciones (dni_cliente, codigo, valido_hasta) VALUES (:dni, :codigo, DATE_ADD(NOW(), INTERVAL 10 MINUTE))");
$insert->execute([':dni' => $dni, ':codigo' => $codigo]);
echo json_encode(['success' => true, 'codigo_local' => $codigo]);
