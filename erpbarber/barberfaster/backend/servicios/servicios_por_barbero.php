<?php
// backend/servicios/servicios_por_barbero.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barbero = $_GET['id_barbero'] ?? null;

if (!$id_barbero) {
    echo json_encode(["status" => "error", "mensaje" => "Se requiere el ID del barbero."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT s.id_servicio, s.nombre, s.descripcion, s.duracion_minutos, s.precio 
        FROM servicios s
        INNER JOIN barbero_servicios bs ON s.id_servicio = bs.id_servicio
        WHERE bs.id_barbero = ? AND s.estado = 'ACTIVO'
    ");
    $stmt->execute([$id_barbero]);
    $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "servicios" => $servicios
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al obtener servicios del barbero: " . $e->getMessage()]);
}
?>