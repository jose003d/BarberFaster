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
require_once __DIR__ . '/../barberos/comun.php';

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

    // La foto apunta a barberos/foto.php, que vive en la carpeta hermana.
    $urlFotoBarberos = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'], 2)), '/') . '/barberos/foto.php?id_foto=';

    echo json_encode([
        'status' => 'success',
        'data' => [
            'barberia' => $barberia,
            'barberos' => listarBarberosPublicos($pdo, $idBarberia, $urlFotoBarberos),
        ],
    ]);
} catch (Throwable $error) {
    error_log('Error al cargar detalle público de barbería: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo cargar el detalle de la barbería.']);
}
