<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$dni = trim((string) ($data['dni'] ?? ''));
$codigo = trim((string) ($data['codigo'] ?? ''));
if (!$dni || !$codigo) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'DNI y código son obligatorios']); exit; }

$stmt = $pdo->prepare("SELECT id_validacion FROM validaciones WHERE dni_cliente = :dni AND codigo = :codigo AND estado = 'PENDIENTE' AND valido_hasta >= NOW() ORDER BY creado_at DESC LIMIT 1");
$stmt->execute([':dni' => $dni, ':codigo' => $codigo]);
$validationId = $stmt->fetchColumn();
if (!$validationId) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'DNI o código inválido']); exit; }
$pdo->prepare("UPDATE validaciones SET estado = 'VERIFICADO' WHERE id_validacion = :id")->execute([':id' => $validationId]);
$cliente = $pdo->prepare("SELECT dni, nombre, apellido, correo FROM clientes WHERE dni = :dni AND estado = 1");
$cliente->execute([':dni' => $dni]);
$clienteData = $cliente->fetch(PDO::FETCH_ASSOC);
echo json_encode(['success' => (bool) $clienteData, 'cliente' => $clienteData, 'error' => $clienteData ? null : 'Cliente no encontrado']);
