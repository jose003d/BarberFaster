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
require_once __DIR__ . '/comun.php';

// Sin barbería explícita no se adivina una: antes se usaba la 1 por defecto.
$idBarberia = filter_var($_GET['id_barberia'] ?? null, FILTER_VALIDATE_INT);
if (!$idBarberia || $idBarberia < 1) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'mensaje' => 'La barbería indicada no es válida.']);
    exit();
}

try {
    echo json_encode(listarBarberosPublicos($pdo, $idBarberia, urlFotoBarbero()));
} catch (Throwable $error) {
    error_log('Error al listar el personal de una barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar el personal de la barbería.']);
}
