<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$id_barbero = $_GET['id_barbero'] ?? null;

if (!$id_barbero) {
    echo json_encode([
        "status" => "error",
        "mensaje" => "Se requiere el ID del barbero."
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare(
        "SELECT
            c.id_cita AS id,
            CONCAT(c.fecha, ' ', c.hora_inicio) AS start,
            CONCAT(c.fecha, ' ', c.hora_fin) AS end,
            CASE
                WHEN c.estado = 'PENDIENTE' THEN 'Cita pendiente'
                WHEN c.estado = 'CONFIRMADA' THEN 'Cita confirmada'
                WHEN c.estado = 'COMPLETADA' THEN 'Cita completada'
                WHEN c.estado = 'CANCELADA' THEN 'Cita cancelada'
                ELSE 'Cita'
            END AS title,
            c.estado,
            c.dni_cliente,
            cl.nombre AS cliente,
            c.precio_total,
            COALESCE(c.notas, '') AS observaciones
        FROM citas c
        LEFT JOIN clientes cl ON cl.dni = c.dni_cliente
        WHERE c.id_barbero = ?
        ORDER BY c.fecha ASC, c.hora_inicio ASC"
    );

    $stmt->execute([$id_barbero]);
    $eventos = $stmt->fetchAll();

    echo json_encode($eventos);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "Error al obtener eventos del barbero: " . $e->getMessage()
    ]);
}
