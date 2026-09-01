<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$sql = "SELECT b.id_barbero, b.id_usuario, b.id_barberia, u.nombre AS usuario, ba.nombre AS barberia, b.especialidad
        FROM barberos b
        JOIN Usuarios u ON b.id_usuario = u.id_usuario
        JOIN barberias ba ON b.id_barberia = ba.id_barberia
        ORDER BY b.id_barbero DESC";
$stmt = $pdo->query($sql);
$barberos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($barberos);

?>