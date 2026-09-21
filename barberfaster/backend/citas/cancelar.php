<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";
$data = json_decode(file_get_contents("php://input"), true) ?: [];
$idCita = (int) ($data['id_cita'] ?? 0);
$dni = trim((string) ($data['dni_cliente'] ?? ''));
if (!$idCita || !$dni) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'id_cita y dni_cliente son obligatorios']); exit; }
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT id_evento FROM citas WHERE id_cita = :cita AND dni_cliente = :dni AND estado = 'PENDIENTE' FOR UPDATE");
    $stmt->execute([':cita' => $idCita, ':dni' => $dni]);
    $cita = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cita) throw new RuntimeException('La cita no está pendiente o no pertenece al cliente');
    $pdo->prepare("UPDATE citas SET estado = 'CANCELADA' WHERE id_cita = :cita")->execute([':cita' => $idCita]);
    $pdo->prepare("UPDATE eventos SET estado_disponibilidad = 'DISPONIBLE' WHERE id_evento = :evento")->execute([':evento' => $cita['id_evento']]);
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(409); echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
