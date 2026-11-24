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

$idTransaccion = $_GET['id'] ?? null;
if (!is_string($idTransaccion) || !preg_match('/^[A-Za-z0-9-]{1,100}$/', $idTransaccion)) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'mensaje' => 'El identificador de pago no es válido.']);
    exit();
}

// Wompi agrega ?id= a la URL de retorno, que ya trae ?barberia= desde
// wompiCrearReferencia(). La barbería indica con qué llave privada consultar.
$idBarberia = filter_var($_GET['barberia'] ?? null, FILTER_VALIDATE_INT);
if (!$idBarberia || $idBarberia < 1) {
    http_response_code(422);
    echo json_encode(['status' => 'error', 'mensaje' => 'Falta indicar la barbería del pago.']);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/comun.php';

try {
    $config = wompiConfiguracionBarberia($pdo, $idBarberia, false);
    wompiLiberarPagosVencidos($pdo);
    // La consulta usa la llave privada de la barbería: solo encuentra pagos
    // hechos a su cuenta. Después se exige que la referencia sea de una cita
    // suya y del mismo ambiente en que se creó.
    $transaccion = wompiConsultarTransaccion($config, $idTransaccion);
    $pago = wompiPagoPorReferencia($pdo, (string) ($transaccion['reference'] ?? ''));
    if ($pago === null || $pago['ambiente'] !== $config['ambiente']) {
        throw new RuntimeException('La transacción no corresponde a una reserva de esta barbería.');
    }
    $resultado = wompiAplicarTransaccion($pdo, $transaccion, $idBarberia);

    echo json_encode([
        'status' => 'success',
        'estado_pago' => $resultado['estado_pago'],
    ]);
} catch (Throwable $error) {
    error_log('Error al verificar el resultado del pago Wompi: ' . $error->getMessage());
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'mensaje' => 'No se pudo verificar el pago. Espera un momento y vuelve a intentar.',
    ], JSON_UNESCAPED_UNICODE);
}
