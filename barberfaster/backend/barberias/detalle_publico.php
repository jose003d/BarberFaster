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

require_once __DIR__ . '/../config/database.php';

try {
    $stmtBarberia = $pdo->prepare("
        SELECT id_barberia, nombre, descripcion, direccion, ciudad, telefono,
               url_mapa, hora_apertura, hora_cierre, foto
        FROM barberias
        WHERE id_barberia = ? AND estado = 'ACTIVA'
    ");
    $stmtBarberia->execute([$idBarberia]);
    $barberia = $stmtBarberia->fetch(PDO::FETCH_ASSOC);
    if (!$barberia) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'mensaje' => 'No se encontró la barbería disponible.']);
        exit();
    }

    $stmtBarberos = $pdo->prepare("
        SELECT
            b.id_barbero,
            b.nombre,
            b.apellido,
            b.especialidad,
            CASE
                WHEN b.foto_datos IS NOT NULL THEN CONCAT(
                    '/erpbarber/barberfaster/backend/barberos/foto.php?id_barbero=',
                    b.id_barbero
                )
                ELSE b.foto
            END AS foto,
            COALESCE(AVG(r.calificacion), 0) AS calificacion_promedio,
            COUNT(r.id_resena) AS cantidad_calificaciones
        FROM barberos b
        LEFT JOIN citas c ON c.id_barbero = b.id_barbero
        LEFT JOIN resenas r ON r.id_cita = c.id_cita
        WHERE b.id_barberia = ? AND b.estado = 'ACTIVO'
        GROUP BY b.id_barbero
        ORDER BY b.nombre, b.apellido
    ");
    $stmtBarberos->execute([$idBarberia]);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'barberia' => $barberia,
            'barberos' => $stmtBarberos->fetchAll(PDO::FETCH_ASSOC),
        ],
    ]);
} catch (Throwable $error) {
    error_log('Error al cargar detalle público de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar el detalle de la barbería.']);
}
