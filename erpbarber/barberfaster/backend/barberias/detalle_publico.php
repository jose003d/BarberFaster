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
            u.id_usuario AS id_barbero,
            u.nombre_completo AS nombre,
            '' AS apellido,
            NULL AS especialidad,
            NULL AS foto,
            COALESCE(AVG(r.calificacion), 0) AS calificacion_promedio,
            COUNT(r.id_resena) AS cantidad_calificaciones
        FROM usuarios u
        LEFT JOIN citas c ON c.id_barbero = u.id_usuario
        LEFT JOIN resenas r ON r.id_cita = c.id_cita
        WHERE u.id_barberia = ?
          AND (u.rol = 'BARBERO' OR (u.rol = 'ADMINISTRADOR' AND u.atiende_clientes = 1))
          AND u.estado = 'ACTIVO'
        GROUP BY u.id_usuario, u.nombre_completo
        ORDER BY u.nombre_completo
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
