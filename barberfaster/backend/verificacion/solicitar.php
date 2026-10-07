<?php

declare(strict_types=1);

require_once __DIR__ . '/comun.php';

setCorsHeaders();
manejarPreflight();

$datos = obtenerJsonBody();
$telefono = obtenerTexto($datos, 'telefono');

if ($telefono === '') {
    responder(400, false, 'El número de teléfono es obligatorio.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido. Usa formato internacional o celular colombiano.');
}

try {
    $codigo = generarCodigoOtp();
    guardarOtp($telefonoNormalizado, $codigo, 300);
    $resultado = enviarMensajeWuapi($telefonoNormalizado, $codigo);
} catch (Throwable $e) {
    error_log('Error interno al preparar envío Wuapi: ' . $e->getMessage());
    $codigoError = strpos($e->getMessage(), 'Falta la variable de entorno') !== false
        ? 'credenciales_no_configuradas'
        : 'error_interno';
    responder(500, false, 'No se pudo generar o guardar el código de verificación.', [
        'codigo_error' => $codigoError,
    ]);
}

if ($resultado['ok'] !== true) {
    $codigoError = ($resultado['http_code'] ?? null) === 500 &&
        strpos($resultado['mensaje'] ?? '', 'extensión cURL') !== false
        ? 'curl_no_disponible'
        : 'error_proveedor';
    responder(502, false, 'No se pudo enviar el código por WhatsApp.', [
        'codigo_error' => $codigoError,
        'http_code' => $resultado['http_code'] ?? null,
        'codigo_proveedor' => $resultado['provider_code'] ?? null,
    ]);
}

responder(200, true, 'Código enviado correctamente.', [
    'telefono' => $telefonoNormalizado,
    'expira_en' => time() + 300,
]);
