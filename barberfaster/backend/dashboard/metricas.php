<?php
// backend/dashboard/metricas.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$id_barberia = $_GET['id_barberia'] ?? null;

if (!$id_barberia) {
    echo json_encode([
        "success" => false,
        "error" => "Se requiere el ID de la barbería."
    ]);
    exit();
}

try {
    $stmtMetricas = $pdo->prepare("
        SELECT 
            COUNT(c.id_cita) AS total_citas,
            COUNT(DISTINCT c.dni_cliente) AS clientes_unicos,
            COALESCE(SUM(CASE WHEN c.estado = 'COMPLETADA' THEN c.precio_total ELSE 0 END), 0.00) AS total_ingresos,
            (SELECT COUNT(*) FROM barberos WHERE id_barberia = ? AND estado = 'ACTIVO') AS total_barberos,
            (SELECT COUNT(*) FROM servicios WHERE id_barberia = ? AND estado = 'ACTIVO') AS servicios_activos,
            5.0 AS calificacion_promedio
        FROM citas c
        WHERE c.id_barberia = ?
    ");
    $stmtMetricas->execute([$id_barberia, $id_barberia, $id_barberia]);
    $metricsData = $stmtMetricas->fetch();

    $stmtReporte = $pdo->prepare("
        SELECT 
            c.id_cita,
            c.estado AS estado_cita,
            c.dni_cliente AS clientes_dni,
            cl.nombre AS cliente,
            CONCAT(c.fecha, ' ', c.hora_inicio) AS start_datetime,
            CONCAT(c.fecha, ' ', c.hora_fin) AS end_datetime,
            c.precio_total AS monto,
            CASE WHEN c.estado = 'COMPLETADA' THEN 'Pagado' ELSE 'Pendiente' END AS estado_pago
        FROM citas c
        LEFT JOIN clientes cl ON c.dni_cliente = cl.dni
        WHERE c.id_barberia = ?
        ORDER BY c.fecha DESC, c.hora_inicio DESC
    ");
    $stmtReporte->execute([$id_barberia]);
    $reporteRows = $stmtReporte->fetchAll();

    echo json_encode([
        "success" => true,
        "metricas" => [
            "total_citas" => (int)($metricsData['total_citas'] ?? 0),
            "clientes_unicos" => (int)($metricsData['clientes_unicos'] ?? 0),
            "total_ingresos" => (float)($metricsData['total_ingresos'] ?? 0),
            "total_barberos" => (int)($metricsData['total_barberos'] ?? 0),
            "servicios_activos" => (int)($metricsData['servicios_activos'] ?? 0),
            "calificacion_promedio" => (float)($metricsData['calificacion_promedio'] ?? 5.0)
        ],
        "reporte" => $reporteRows
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "Error al obtener métricas: " . $e->getMessage()
    ]);
}