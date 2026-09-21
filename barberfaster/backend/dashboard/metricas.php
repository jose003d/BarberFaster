<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

$idBarberia = (int) ($_GET['id_barberia'] ?? 0);
if (!$idBarberia) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Falta el id_barberia']);
    exit;
}

try {
    $hasDescripcion = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'barberias' AND column_name = 'descripcion'")->fetchColumn();
    $hasCitaDniCliente = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'citas' AND column_name = 'dni_cliente'")->fetchColumn();
    $hasPagos = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'pagos'")->fetchColumn();
    $hasPagosIdBarberia = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pagos' AND column_name = 'id_barberia'")->fetchColumn();
    $hasPagosEstado = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pagos' AND column_name = 'estado'")->fetchColumn();
    $hasPagosMonto = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pagos' AND column_name = 'monto'")->fetchColumn();
    $hasResenas = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'resenas'")->fetchColumn();
    $hasClientes = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'clientes'")->fetchColumn();
    $hasBarberiaEstado = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'barberias' AND column_name = 'estado'")->fetchColumn();
    $hasBarberiaActivo = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'barberias' AND column_name = 'activo'")->fetchColumn();
    $hasServicioEstado = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'servicios' AND column_name = 'estado'")->fetchColumn();
    $hasServicioActivo = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'servicios' AND column_name = 'activo'")->fetchColumn();

    $barberiaStateClause = $hasBarberiaEstado > 0 ? "estado = 1" : ($hasBarberiaActivo > 0 ? "activo = 1" : "1 = 1");
    $barberiaSql = "SELECT id_barberia, nombre, direccion";
    if ($hasDescripcion > 0) {
        $barberiaSql .= ", descripcion";
    }
    $barberiaSql .= " FROM barberias WHERE id_barberia = ? AND " . $barberiaStateClause;

    $barberia = $pdo->prepare($barberiaSql);
    $barberia->execute([$idBarberia]);
    $barberiaData = $barberia->fetch(PDO::FETCH_ASSOC);

    if (!$barberiaData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Barbería no encontrada']);
        exit;
    }

    $totalCitas = (int) $pdo->prepare("SELECT COUNT(c.id_cita) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = ?")->execute([$idBarberia]);
    $totalCitas = (int) $pdo->query("SELECT COUNT(c.id_cita) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = " . (int) $idBarberia)->fetchColumn();

    $clientesUnicos = (int) $pdo->query(
        ($hasCitaDniCliente > 0
            ? "SELECT COUNT(DISTINCT c.dni_cliente) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = " . (int) $idBarberia
            : "SELECT COUNT(DISTINCT c.id_cita) FROM citas c INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = " . (int) $idBarberia)
    )->fetchColumn();

    $totalBarberos = (int) $pdo->query("SELECT COUNT(*) FROM barberos WHERE id_barberia = " . (int) $idBarberia)->fetchColumn();

    $servicioStateFilter = $hasServicioEstado > 0 ? "estado = 1" : ($hasServicioActivo > 0 ? "activo = 1" : "1 = 1");
    $serviciosActivos = (int) $pdo->query("SELECT COUNT(*) FROM servicios WHERE id_barberia = " . (int) $idBarberia . " AND " . $servicioStateFilter)->fetchColumn();

    $calificacionPromedio = 0.0;
    if ($hasResenas > 0) {
        $calificacionPromedio = (float) $pdo->query(
            "SELECT COALESCE(AVG(r.calificacion), 0) FROM resenas r INNER JOIN citas c ON c.id_cita = r.id_cita INNER JOIN eventos e ON e.id_evento = c.id_evento WHERE e.id_barberia = " . (int) $idBarberia
        )->fetchColumn();
    }

    $totalIngresos = 0.0;
    if ($hasPagos > 0 && $hasPagosIdBarberia > 0 && $hasPagosEstado > 0 && $hasPagosMonto > 0) {
        $totalIngresos = (float) $pdo->query(
            "SELECT COALESCE(SUM(p.monto), 0) FROM pagos p WHERE p.id_barberia = " . (int) $idBarberia . " AND p.estado = 'pagado'"
        )->fetchColumn();
    }

    $reportSql = "
        SELECT
            c.id_cita,
            c.estado AS estado_cita,
            " . ($hasCitaDniCliente > 0 ? "c.dni_cliente AS clientes_dni" : "NULL AS clientes_dni") . ",
            e.start_datetime,
            e.end_datetime,
            " . ($hasCitaDniCliente > 0 && $hasClientes > 0 ? "CONCAT(cl.nombre, ' ', COALESCE(cl.apellido, '')) AS cliente" : "NULL AS cliente") . ",
            0 AS monto,
            'PENDIENTE' AS estado_pago
        FROM citas c
        INNER JOIN eventos e ON e.id_evento = c.id_evento
        " . ($hasCitaDniCliente > 0 && $hasClientes > 0 ? "INNER JOIN clientes cl ON cl.dni = c.dni_cliente" : "") . "
        WHERE e.id_barberia = ?
        ORDER BY e.start_datetime DESC
    ";

    $report = $pdo->prepare($reportSql);
    $report->execute([$idBarberia]);

    echo json_encode([
        'success' => true,
        'barberia' => $barberiaData,
        'metricas' => [
            'total_citas' => $totalCitas,
            'clientes_unicos' => $clientesUnicos,
            'total_ingresos' => $totalIngresos,
            'total_barberos' => $totalBarberos,
            'servicios_activos' => $serviciosActivos,
            'calificacion_promedio' => round($calificacionPromedio, 1),
        ],
        'reporte' => $report->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
