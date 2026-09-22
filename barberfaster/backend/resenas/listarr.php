<?php
// backend/resenas/listarr.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barberia = $_GET['id_barberia'] ?? null;
$id_barbero  = $_GET['id_barbero'] ?? null;

if (!$id_barberia && !$id_barbero) {
    echo json_encode(["status" => "error", "mensaje" => "Se requiere ID de barbería o de barbero."]);
    exit();
}

try {
    $where = $id_barberia ? "c.id_barberia = ?" : "c.id_barbero = ?";
    $param = $id_barberia ? $id_barberia : $id_barbero;

    $stmt = $pdo->prepare("
        SELECT 
            c.id_cita,
            cl.nombre AS cliente,
            c.fecha,
            c.notas AS reseña
        FROM citas c
        INNER JOIN clientes cl ON c.dni_cliente = cl.dni
        WHERE $where AND c.notas LIKE '[Calificación:%'
        ORDER BY c.fecha DESC
    ");
    $stmt->execute([$param]);
    $resenas = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "datos" => $resenas
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al listar reseñas: " . $e->getMessage()]);
}