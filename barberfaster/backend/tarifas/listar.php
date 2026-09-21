<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
$idBarberia = (int) ($_GET['id_barberia'] ?? 0);
$stmt = $pdo->prepare("SELECT t.id_tarifa, t.id_barberia, t.id_servicio, s.nombre, s.duracion_estimada, t.precio FROM tarifas t INNER JOIN servicios s ON s.id_servicio = t.id_servicio WHERE t.id_barberia = :barberia ORDER BY s.nombre");
$stmt->execute([':barberia' => $idBarberia]);
echo json_encode(['success' => true, 'tarifas' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
