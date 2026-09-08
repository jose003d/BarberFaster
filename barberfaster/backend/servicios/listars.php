<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $sql = "SELECT s.id_servicio, s.id_barberia, s.nombre, s.precio, s.duracion_minutos, s.activo,
                   b.nombre AS nombre_barberia
            FROM servicios s
            JOIN barberias b ON b.id_barberia = s.id_barberia
            ORDER BY s.id_servicio DESC";
    echo json_encode(["success" => true, "servicios" => $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
