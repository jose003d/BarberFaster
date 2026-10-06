<?php

declare(strict_types=1);

require_once __DIR__ . '/../verificacion/comun.php';

setCorsHeaders();
manejarPreflight();

$data = obtenerJsonBody();
$telefono = obtenerTexto($data, 'telefono');

if ($telefono === '') {
    responder(400, false, 'El número de teléfono es obligatorio.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido.');
}

try {
    $codigo = generarCodigoOtp();
    guardarOtp($telefonoNormalizado, $codigo, 300);
    $resultado = enviarMensajeWuapi($telefonoNormalizado, $codigo);
} catch (Throwable $e) {
    responder(500, false, 'No se pudo generar o guardar el código de verificación.', [
        'detalle' => $e->getMessage(),
    ]);
}

if ($resultado['ok'] !== true) {
    responder(502, false, 'No se pudo enviar el código por WhatsApp.', [
        'detalle' => $resultado['mensaje'] ?? 'Error desconocido de Wuapi.',
        'http_code' => $resultado['http_code'] ?? null,
    ]);
}

responder(200, true, 'Código enviado correctamente.', [
    'telefono' => $telefonoNormalizado,
    'expira_en' => time() + 300,
    'codigo_demo' => $codigo,
]);