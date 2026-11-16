<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/comun.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit();
}

try {
    $config = wompiConfiguracion();
    $evento = json_decode(file_get_contents('php://input'), true);
    if (!is_array($evento) || ($evento['event'] ?? null) !== 'transaction.updated') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'El evento de Wompi no es válido.']);
        exit();
    }
    if (!wompiFirmaEventoValida($evento, $config['secreto_eventos'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'mensaje' => 'La firma del evento no es válida.']);
        exit();
    }

    $transaccion = $evento['data']['transaction'] ?? null;
    if (!is_array($transaccion)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'El evento no contiene una transacción.']);
        exit();
    }

    wompiLiberarPagosVencidos($pdo);
    $resultado = wompiAplicarTransaccion($pdo, $transaccion);
    echo json_encode(['status' => 'success', 'resultado' => $resultado]);
} catch (Throwable $error) {
    error_log('Error al procesar evento de Wompi: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo procesar el evento de Wompi.']);
}
