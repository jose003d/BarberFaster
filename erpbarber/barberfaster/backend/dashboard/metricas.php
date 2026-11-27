<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    if ($usuario['rol'] === 'ADMINISTRADOR') {
        $idBarberia = $usuario['id_barberia'];
        if (!$idBarberia) {
            responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
        }
    } else {
        $idBarberia = filter_var($_GET['id_barberia'] ?? null, FILTER_VALIDATE_INT);
        if (!$idBarberia || $idBarberia < 1) {
            http_response_code(422);
            echo json_encode(['status' => 'error', 'mensaje' => 'Selecciona una barbería válida.']);
            exit();
        }
    }

    $stmtMetricas = $pdo->prepare("
        SELECT
            COUNT(c.id_cita) AS total_citas,
            COUNT(DISTINCT c.dni_cliente) AS clientes_unicos,
            COALESCE(SUM(CASE WHEN c.estado = 'COMPLETADA' THEN c.precio_total ELSE 0 END), 0.00) AS total_ingresos,
            (
                SELECT COUNT(*)
                FROM usuarios
                WHERE id_barberia = ? AND (rol = 'BARBERO' OR (rol = 'ADMINISTRADOR' AND atiende_clientes = 1)) AND estado = 'ACTIVO'
            ) AS total_barberos,
            (SELECT COUNT(*) FROM servicios WHERE id_barberia = ? AND estado = 'ACTIVO') AS servicios_activos,
            5.0 AS calificacion_promedio
        FROM citas c
        WHERE c.id_barberia = ?
    ");
    $stmtMetricas->execute([$idBarberia, $idBarberia, $idBarberia]);
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
    $stmtReporte->execute([$idBarberia]);

    echo json_encode([
        'success' => true,
        'metricas' => [
            'total_citas' => (int) ($metricsData['total_citas'] ?? 0),
            'clientes_unicos' => (int) ($metricsData['clientes_unicos'] ?? 0),
            'total_ingresos' => (float) ($metricsData['total_ingresos'] ?? 0),
            'total_barberos' => (int) ($metricsData['total_barberos'] ?? 0),
            'servicios_activos' => (int) ($metricsData['servicios_activos'] ?? 0),
            'calificacion_promedio' => (float) ($metricsData['calificacion_promedio'] ?? 5.0),
        ],
        'reporte' => $stmtReporte->fetchAll(),
    ]);
} catch (Throwable $error) {
    error_log('Error al obtener métricas: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las métricas.']);
}
