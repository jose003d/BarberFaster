<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

$idBarberia = (int) ($_GET['id_barberia'] ?? 0);
if (!$idBarberia) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Falta el id_barberia"]);
    exit;
}

try {
    // Las métricas se calculan por barbería para aislar la información de cada local.
    $barberiaStmt = $pdo->prepare("SELECT id_barberia, nombre, ciudad FROM barberias WHERE id_barberia = :id AND estado = 1");
    $barberiaStmt->execute([':id' => $idBarberia]);
    $barberia = $barberiaStmt->fetch(PDO::FETCH_ASSOC);
    if (!$barberia) {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Barbería no encontrada"]);
        exit;
    }

    $metricsStmt = $pdo->prepare(
        "SELECT
            (SELECT COUNT(*) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = :id_citas) AS total_citas,
            (SELECT COUNT(DISTINCT c.clientes_dni) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = :id_clientes AND c.clientes_dni IS NOT NULL) AS clientes_unicos,
            (SELECT COALESCE(SUM(p.monto), 0) FROM pagos p INNER JOIN citas c ON c.id_cita = p.id_cita INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = :id_ingresos AND p.estado = 'PAGADO') AS total_ingresos,
            (SELECT COUNT(*) FROM barberos b WHERE b.id_barberia = :id_barberos) AS total_barberos,
            (SELECT COUNT(*) FROM servicios s WHERE s.id_barberia = :id_servicios AND s.activo = 1) AS servicios_activos,
            (SELECT COALESCE(AVG(r.calificacion), 0) FROM resenas r INNER JOIN citas c ON c.id_cita = r.id_cita INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = :id_calificacion) AS calificacion_promedio"
    );
    $metricsStmt->execute([
        ':id_citas' => $idBarberia,
        ':id_clientes' => $idBarberia,
        ':id_ingresos' => $idBarberia,
        ':id_barberos' => $idBarberia,
        ':id_servicios' => $idBarberia,
        ':id_calificacion' => $idBarberia,
    ]);
    $metrics = $metricsStmt->fetch(PDO::FETCH_ASSOC);

    // El mismo endpoint entrega el detalle que consume la exportación CSV.
    $reportStmt = $pdo->prepare(
        "SELECT c.id_cita, c.estado AS estado_cita, c.clientes_dni, e.start_datetime, e.end_datetime,
                COALESCE(CONCAT(cl.nombre, ' ', cl.apellido), 'Sin cliente') AS cliente,
                COALESCE(p.monto, 0) AS monto, COALESCE(p.estado, 'PENDIENTE') AS estado_pago
         FROM citas c
         INNER JOIN eventos e ON e.id_evento = c.id_evento
         LEFT JOIN clientes cl ON cl.dni = c.clientes_dni
         LEFT JOIN pagos p ON p.id_cita = c.id_cita
         WHERE e.id_barberia = :id
         ORDER BY e.start_datetime DESC"
    );
    $reportStmt->execute([':id' => $idBarberia]);

    echo json_encode([
        "success" => true,
        "barberia" => $barberia,
        "metricas" => [
            "total_citas" => (int) $metrics['total_citas'],
            "clientes_unicos" => (int) $metrics['clientes_unicos'],
            "total_ingresos" => (float) $metrics['total_ingresos'],
            "total_barberos" => (int) $metrics['total_barberos'],
            "servicios_activos" => (int) $metrics['servicios_activos'],
            "calificacion_promedio" => round((float) $metrics['calificacion_promedio'], 1),
        ],
        "reporte" => $reportStmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
