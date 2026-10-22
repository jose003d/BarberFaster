<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

$idBarberia = filter_input(INPUT_GET, 'id_barberia', FILTER_VALIDATE_INT);
if (!$idBarberia || $idBarberia < 1) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => 'Indica una barbería válida.']);
    exit();
}

$idBarberoHistorial = null;
if (isset($_GET['id_barbero'])) {
    $idBarberoHistorial = filter_var($_GET['id_barbero'], FILTER_VALIDATE_INT);
    if (!$idBarberoHistorial || $idBarberoHistorial < 1) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'Indica un barbero válido para consultar su historial.']);
        exit();
    }
}

require_once __DIR__ . '/../config/database.php';

try {
    $ahora = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
    $ahoraSql = $ahora->format('Y-m-d H:i:s');

    // Actualiza turnos vencidos para que la agenda general refleje su estado real.
    $actualizarVencidas = $pdo->prepare("
        UPDATE citas
        SET estado = 'COMPLETADA'
        WHERE id_barberia = ?
          AND estado IN ('PENDIENTE', 'CONFIRMADA')
          AND CONCAT(fecha, ' ', hora_fin) <= ?
    ");
    $actualizarVencidas->execute([$idBarberia, $ahoraSql]);

    $stmtBarberia = $pdo->prepare("
        SELECT id_barbero, nombre, apellido, especialidad
        FROM barberos
        WHERE id_barberia = ? AND estado = 'ACTIVO'
        ORDER BY nombre, apellido
    ");
    $stmtBarberia->execute([$idBarberia]);
    $barberos = $stmtBarberia->fetchAll(PDO::FETCH_ASSOC);

    $stmtProximas = $pdo->prepare("
        SELECT
            c.id_cita,
            c.id_barbero,
            c.fecha,
            c.hora_inicio,
            c.hora_fin,
            c.estado,
            cl.nombre AS nombre_cliente,
            b.nombre AS nombre_barbero,
            b.apellido AS apellido_barbero,
            GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
        FROM citas c
        INNER JOIN barberos b ON b.id_barbero = c.id_barbero
        INNER JOIN clientes cl ON cl.dni = c.dni_cliente
        LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
        LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
        WHERE c.id_barberia = ?
          AND b.estado = 'ACTIVO'
          AND c.estado IN ('PENDIENTE', 'CONFIRMADA')
          AND CONCAT(c.fecha, ' ', c.hora_fin) > ?
        GROUP BY c.id_cita
        ORDER BY c.fecha ASC, c.hora_inicio ASC
    ");
    $stmtProximas->execute([$idBarberia, $ahoraSql]);

    $historial = [];
    if ($idBarberoHistorial !== null) {
        $stmtHistorial = $pdo->prepare("
            SELECT
                c.id_cita,
                c.id_barbero,
                c.fecha,
                c.hora_inicio,
                c.hora_fin,
                c.estado,
                cl.nombre AS nombre_cliente,
                b.nombre AS nombre_barbero,
                b.apellido AS apellido_barbero,
                GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios
            FROM citas c
            INNER JOIN barberos b ON b.id_barbero = c.id_barbero
            INNER JOIN clientes cl ON cl.dni = c.dni_cliente
            LEFT JOIN cita_servicios cs ON cs.id_cita = c.id_cita
            LEFT JOIN servicios s ON s.id_servicio = cs.id_servicio
            WHERE c.id_barberia = ?
              AND c.id_barbero = ?
              AND (
                c.estado IN ('COMPLETADA', 'CANCELADA')
                OR (
                  c.estado IN ('PENDIENTE', 'CONFIRMADA')
                  AND CONCAT(c.fecha, ' ', c.hora_fin) <= ?
                )
              )
            GROUP BY c.id_cita
            ORDER BY c.fecha DESC, c.hora_inicio DESC
        ");
        $stmtHistorial->execute([$idBarberia, $idBarberoHistorial, $ahoraSql]);
        $historial = $stmtHistorial->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'status' => 'success',
        'barberos' => $barberos,
        'proximas' => $stmtProximas->fetchAll(PDO::FETCH_ASSOC),
        'historial' => $historial,
    ]);
} catch (Throwable $error) {
    error_log('Error al cargar agenda general de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar la agenda de la barbería.']);
}
