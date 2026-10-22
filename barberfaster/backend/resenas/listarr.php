<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

$idBarbero = filter_var($_GET['id_barbero'] ?? null, FILTER_VALIDATE_INT);
if ($idBarbero === false || $idBarbero < 1) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'mensaje' => 'Indica un identificador de barbero válido.']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT r.id_cita, r.calificacion, r.fecha_creacion
        FROM resenas r
        INNER JOIN citas c ON c.id_cita = r.id_cita
        WHERE c.id_barbero = ?
        ORDER BY r.fecha_creacion DESC
    ");
    $stmt->execute([$idBarbero]);
    echo json_encode(['status' => 'success', 'datos' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    error_log('Error al listar calificaciones del barbero: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudieron cargar las calificaciones.']);
}