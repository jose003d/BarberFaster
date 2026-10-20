<?php
// backend/resenas/listarr.php
// Este archivo devuelve las reseñas asociadas a una barbería o a un barbero.
// Solo incluye citas que tengan una nota con formato tipo "[Calificación: ...]".

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a la base de datos.
require_once '../config/database.php';

// Obtiene el filtro desde la URL: id_barberia o id_barbero.
$id_barberia = $_GET['id_barberia'] ?? null;
$id_barbero  = $_GET['id_barbero'] ?? null;

// Debe venir al menos uno de los dos IDs.
if (!$id_barberia && !$id_barbero) {
    echo json_encode(["status" => "error", "mensaje" => "Se requiere ID de barbería o de barbero."]);
    exit();
}

try {
    // Decide si se filtra por barbería o por barbero.
    $where = $id_barberia ? "c.id_barberia = ?" : "c.id_barbero = ?";
    $param = $id_barberia ? $id_barberia : $id_barbero;

    // Consulta las reseñas con formato de calificación en el campo notas.
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

    // Devuelve la lista de reseñas como JSON.
    echo json_encode([
        "status" => "success",
        "datos" => $resenas
    ]);
} catch (Exception $e) {
    // Si ocurre un error, retorna el detalle.
    echo json_encode(["status" => "error", "mensaje" => "Error al listar reseñas: " . $e->getMessage()]);
}