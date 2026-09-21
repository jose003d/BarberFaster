<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $idBarbero = (int) ($data['id_barbero'] ?? 0);
    $start = trim((string) ($data['start_datetime'] ?? $data['start'] ?? ''));
    $end = trim((string) ($data['end_datetime'] ?? $data['end'] ?? ''));
    if (!$idBarbero || !$start || !$end) throw new InvalidArgumentException("id_barbero, start_datetime y end_datetime son obligatorios");

    $barbero = $pdo->prepare("SELECT id_barberia FROM barberos WHERE id_barbero = :id AND estado = 1");
    $barbero->execute([':id' => $idBarbero]);
    $idBarberia = $barbero->fetchColumn();
    if (!$idBarberia) throw new InvalidArgumentException("Barbero no encontrado");

    $pdo->beginTransaction();
    $conflict = $pdo->prepare("SELECT id_evento FROM eventos WHERE id_barbero = :barbero AND estado_disponibilidad <> 'BLOQUEADO' AND start_datetime < :end AND end_datetime > :start FOR UPDATE");
    $conflict->execute([':barbero' => $idBarbero, ':start' => $start, ':end' => $end]);
    if ($conflict->fetch()) throw new RuntimeException("El rango se solapa con otro evento");

    $insert = $pdo->prepare("INSERT INTO eventos (id_barbero, id_barberia, start_datetime, end_datetime, estado_disponibilidad) VALUES (:barbero, :barberia, :start, :end, 'DISPONIBLE')");
    $insert->execute([':barbero' => $idBarbero, ':barberia' => $idBarberia, ':start' => $start, ':end' => $end]);
    $idEvento = (int) $pdo->lastInsertId();
    $pdo->commit();
    echo json_encode(['success' => true, 'id_evento' => $idEvento]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code($e instanceof InvalidArgumentException ? 400 : 409);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
