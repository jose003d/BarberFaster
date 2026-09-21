<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json"); require_once "../config/database.php";
try {
	$sql = "SELECT s.id_servicio, s.id_barberia, s.nombre, s.duracion_estimada, s.duracion_estimada AS duracion_minutos, s.estado AS activo, t.precio, b.nombre AS nombre_barberia FROM servicios s INNER JOIN barberias b ON b.id_barberia = s.id_barberia LEFT JOIN tarifas t ON t.id_servicio = s.id_servicio AND t.id_barberia = s.id_barberia ORDER BY s.id_servicio DESC";
	$servicios = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $error) {
	$sql = "SELECT s.id_servicio, s.id_barberia, s.nombre, s.duracion_minutos AS duracion_estimada, s.duracion_minutos, s.activo, s.precio, b.nombre AS nombre_barberia FROM servicios s INNER JOIN barberias b ON b.id_barberia = s.id_barberia ORDER BY s.id_servicio DESC";
	$servicios = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}
echo json_encode(['success' => true, 'servicios' => $servicios]);
