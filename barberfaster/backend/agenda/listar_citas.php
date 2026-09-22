<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ... resto de tu código PHP

require_once '../config/database.php';

$id_barbero  = $_GET['id_barbero'] ?? null;
$id_barberia = $_GET['id_barberia'] ?? null;
$fecha       = $_GET['fecha'] ?? null; // Opcional: YYYY-MM-DD

if (!$id_barbero && !$id_barberia) {
    echo json_encode(["status" => "error", "mensaje" => "Se requiere ID de barbero o de barbería."]);
    exit();
}

try {
    $sql = "
        SELECT 
            c.id_cita,
            c.id_barberia,
            c.id_barbero,
            c.dni_cliente,
            cl.nombre AS nombre_cliente,
            cl.telefono AS telefono_cliente,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.precio_total,
            c.estado,
            c.notas,
            GROUP_CONCAT(s.nombre SEPARATOR ', ') AS servicios_nombres
        FROM citas c
        INNER JOIN clientes cl ON c.dni_cliente = cl.dni
        LEFT JOIN cita_servicios cs ON c.id_cita = cs.id_cita
        LEFT JOIN servicios s ON cs.id_servicio = s.id_servicio
        WHERE 1=1
    ";

    $params = [];

    if ($id_barbero) {
        $sql .= " AND c.id_barbero = ?";
        $params[] = $id_barbero;
    }

    if ($id_barberia) {
        $sql .= " AND c.id_barberia = ?";
        $params[] = $id_barberia;
    }

    if ($fecha) {
        $sql .= " AND c.fecha = ?";
        $params[] = $fecha;
    }

    $sql .= " GROUP BY c.id_cita ORDER BY c.fecha ASC, c.hora_inicio ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $citas = $stmt->fetchAll();

    echo json_encode([
        "status" => "success",
        "datos" => $citas
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "mensaje" => "Error al obtener citas: " . $e->getMessage()]);
}