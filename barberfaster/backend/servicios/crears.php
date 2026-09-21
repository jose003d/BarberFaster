<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json"); require_once "../config/database.php";
try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $barberia = (int) ($data['id_barberia'] ?? 0); $nombre = trim((string) ($data['nombre'] ?? '')); $duracion = (int) ($data['duracion_estimada'] ?? $data['duracion_minutos'] ?? 0); $precio = (float) ($data['precio'] ?? -1);
    if (!$barberia || !$nombre || $duracion < 1 || $precio < 0) throw new InvalidArgumentException('Completa servicio, duración y tarifa');
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO servicios (id_barberia, nombre, duracion_estimada) VALUES (:barberia, :nombre, :duracion)"); $stmt->execute([':barberia' => $barberia, ':nombre' => $nombre, ':duracion' => $duracion]);
    $id = (int) $pdo->lastInsertId(); $tarifa = $pdo->prepare("INSERT INTO tarifas (id_servicio, id_barberia, precio) VALUES (:servicio, :barberia, :precio)"); $tarifa->execute([':servicio' => $id, ':barberia' => $barberia, ':precio' => $precio]); $pdo->commit();
    echo json_encode(['success' => true, 'id_servicio' => $id]);
} catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); http_response_code(400); echo json_encode(['success' => false, 'error' => $e->getMessage()]); }
