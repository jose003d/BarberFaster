<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

try {
    $usuario = requerirRol($pdo, ['ADMINISTRADOR']);
    if (!$usuario['id_barberia']) {
        responderErrorAuth(403, 'La cuenta administrativa no tiene una barbería asignada.');
    }

    $stmt = $pdo->prepare("
        SELECT id_notificacion, id_cita, tipo, mensaje, leida, creado_en
        FROM notificaciones_barberia
        WHERE id_barberia = :id_barberia
        ORDER BY creado_en DESC
        LIMIT 20
    ");
    $stmt->execute([':id_barberia' => $usuario['id_barberia']]);
    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Throwable $error) {
    error_log('Error al cargar las notificaciones de pagos: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las notificaciones.']);
}
