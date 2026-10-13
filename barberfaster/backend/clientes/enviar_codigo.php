<?php

// Genera un código temporal de verificación y lo envía al cliente por Wuapi.

declare(strict_types=1);

// Carga validaciones, respuestas JSON y funciones compartidas de mensajería.
require_once __DIR__ . '/../verificacion/comun.php';

// Configura CORS y responde inmediatamente a solicitudes preflight.
setCorsHeaders();
manejarPreflight();

$data = obtenerJsonBody();
$telefono = obtenerTexto($data, 'telefono');

// Valida y normaliza el teléfono antes de crear el código de un solo uso.
if ($telefono === '') {
    responder(400, false, 'El número de teléfono es obligatorio.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido.');
}

try {
    // Guarda un OTP de cinco minutos y solicita su envío al proveedor WhatsApp.
    $codigo = generarCodigoOtp();
    guardarOtp($telefonoNormalizado, $codigo, 300);
    $resultado = enviarMensajeWuapi($telefonoNormalizado, $codigo);
} catch (Throwable $e) {
    responder(500, false, 'No se pudo generar o guardar el código de verificación.', [
        'detalle' => $e->getMessage(),
    ]);
}

// Devuelve el resultado del proveedor o la información del envío completado.
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