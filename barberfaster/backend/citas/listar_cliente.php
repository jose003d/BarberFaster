<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
$dni = trim((string) ($_GET['dni_cliente'] ?? ''));
$stmt = $pdo->prepare("SELECT c.id_cita, c.estado, c.observaciones, e.id_evento, e.start_datetime, e.end_datetime, b.nombre AS barbero, bar.nombre AS barberia FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento INNER JOIN barberos b ON b.id_barbero = c.id_barbero INNER JOIN barberias bar ON bar.id_barberia = e.id_barberia WHERE c.dni_cliente = :dni ORDER BY e.start_datetime DESC");
$stmt->execute([':dni' => $dni]);
echo json_encode(['success' => true, 'citas' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
