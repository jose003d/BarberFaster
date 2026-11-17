<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$idBarberia = filter_var($_GET['id_barberia'] ?? 1, FILTER_VALIDATE_INT);
if (!$idBarberia || $idBarberia < 1) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'mensaje' => 'La barbería indicada no es válida.']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT
            u.id_usuario AS id_barbero,
            u.id_barberia,
            u.nombre_completo AS nombre,
            u.rol = 'ADMINISTRADOR' AS es_administrador,
            '' AS apellido,
            NULL AS especialidad,
            NULL AS foto,
            COALESCE(AVG(r.calificacion), 0) AS calificacion_promedio,
            COUNT(r.id_resena) AS cantidad_calificaciones
        FROM usuarios u
        LEFT JOIN citas c ON c.id_barbero = u.id_usuario
        LEFT JOIN resenas r ON r.id_cita = c.id_cita
        WHERE u.id_barberia = :id_barberia
          AND (u.rol = 'BARBERO' OR (u.rol = 'ADMINISTRADOR' AND u.atiende_clientes = 1))
          AND u.estado = 'ACTIVO'
        GROUP BY u.id_usuario, u.id_barberia, u.nombre_completo, u.rol
        ORDER BY u.nombre_completo ASC
    ");
    $stmt->execute([':id_barberia' => $idBarberia]);

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Throwable $error) {
    error_log('Error al listar el personal de una barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar el personal de la barbería.']);
}
