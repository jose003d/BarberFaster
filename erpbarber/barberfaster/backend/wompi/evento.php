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
    $evento = json_decode(file_get_contents('php://input'), true);
    if (!is_array($evento) || ($evento['event'] ?? null) !== 'transaction.updated') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'El evento de Wompi no es válido.']);
        exit();
    }

    $transaccion = $evento['data']['transaction'] ?? null;
    $referencia = is_array($transaccion) ? ($transaccion['reference'] ?? null) : null;
    if (!is_string($referencia) || $referencia === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'mensaje' => 'El evento no contiene una transacción.']);
        exit();
    }

    // Todas las barberías registran esta misma URL. La referencia (generada por
    // BarberFaster) indica de qué barbería es el pago, y con eso se elige qué
    // secreto de eventos valida la firma. Nada cambia antes de validarla.
    $pago = wompiPagoPorReferencia($pdo, $referencia);
    if ($pago === null || $pago['ambiente'] === null) {
        // No es una reserva de BarberFaster (o es anterior a los pagos por
        // barbería): se responde 200 para que Wompi no reintente.
        echo json_encode(['status' => 'success', 'resultado' => 'ignorado']);
        exit();
    }

    $config = wompiConfiguracionBarberia($pdo, (int) $pago['id_barberia'], false);
    $ambienteEvento = ($evento['environment'] ?? null) === 'prod' ? 'production' : 'sandbox';
    if (
        $config['ambiente'] !== $pago['ambiente']
        || $ambienteEvento !== $pago['ambiente']
        || !wompiFirmaEventoValida($evento, $config['secreto_eventos'])
    ) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'mensaje' => 'La firma del evento no es válida.']);
        exit();
    }

    wompiLiberarPagosVencidos($pdo);
    $resultado = wompiAplicarTransaccion($pdo, $transaccion, (int) $pago['id_barberia']);
    echo json_encode(['status' => 'success', 'resultado' => $resultado]);
} catch (Throwable $error) {
    error_log('Error al procesar evento de Wompi: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo procesar el evento de Wompi.']);
}
