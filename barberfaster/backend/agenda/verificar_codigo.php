<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
$dni = trim((string) ($_GET['dni'] ?? ''));
$codigo = trim((string) ($_GET['codigo'] ?? ''));
if (!$dni || !$codigo) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Faltan parámetros']); exit; }
$stmt = $pdo->prepare("SELECT id_validacion FROM validaciones WHERE dni_cliente = :dni AND codigo = :codigo AND estado = 'PENDIENTE' AND valido_hasta >= NOW() ORDER BY creado_at DESC LIMIT 1");
$stmt->execute([':dni' => $dni, ':codigo' => $codigo]);
$id = $stmt->fetchColumn();
if (!$id) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'Código inválido o expirado']); exit; }
$pdo->prepare("UPDATE validaciones SET estado = 'VERIFICADO' WHERE id_validacion = :id")->execute([':id' => $id]);
echo json_encode(['success' => true, 'message' => 'Código verificado']);
