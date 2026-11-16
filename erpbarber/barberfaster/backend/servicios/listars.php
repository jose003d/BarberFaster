<?php
// backend/servicios/listars.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barberia = $_GET['id_barberia'] ?? null;

try {
    if ($id_barberia) {
        $stmt = $pdo->prepare("SELECT id_servicio, nombre, descripcion, duracion_minutos, precio, estado FROM servicios WHERE id_barberia = ? AND estado = 'ACTIVO'");
        $stmt->execute([$id_barberia]);
    } else {
        $stmt = $pdo->query("SELECT id_servicio, nombre, descripcion, duracion_minutos, precio, estado FROM servicios WHERE estado = 'ACTIVO'");
    }

    $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "datos" => $servicios
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al listar servicios: " . $e->getMessage()]);
}
?>