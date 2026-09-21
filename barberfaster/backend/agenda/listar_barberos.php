<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";
try {
	$stmt = $pdo->query("SELECT b.id_barbero, b.id_barberia, b.id_usuario, b.nombre, b.perfil, bar.nombre AS barberia FROM barberos b INNER JOIN barberias bar ON bar.id_barberia = b.id_barberia WHERE b.estado = 1 ORDER BY b.nombre");
} catch (PDOException $error) {
	$stmt = $pdo->query("SELECT b.id_barbero, b.id_barberia, b.id_usuario, CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS nombre, u.rol, bar.nombre AS barberia FROM barberos b INNER JOIN Usuarios u ON u.id_usuario = b.id_usuario INNER JOIN barberias bar ON bar.id_barberia = b.id_barberia WHERE u.estado = 1 AND LOWER(u.rol) = 'barbero' ORDER BY u.nombre");
}
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
