<?php

// Genera un código OTP temporal y solicita su envío al teléfono del cliente.

declare(strict_types=1);

// Carga normalización, utilidades OTP, mensajería y respuestas comunes.
require_once __DIR__ . '/comun.php';

// Configura CORS y termina solicitudes preflight del navegador.
setCorsHeaders();
manejarPreflight();

$datos = obtenerJsonBody();
$telefono = obtenerTexto($datos, 'telefono');
$dniCliente = obtenerTexto($datos, 'dni_cliente');
$nombreCliente = obtenerTexto($datos, 'nombre_cliente');
$contexto = [];

// Rechaza números vacíos o que no tengan un formato admitido.
if ($telefono === '') {
    responder(400, false, 'El número de teléfono es obligatorio.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido. Usa formato internacional o celular colombiano.');
}

if ($dniCliente !== '' || $nombreCliente !== '') {
    if ($dniCliente === '' || $nombreCliente === '') {
        responder(400, false, 'Ingresa el nombre y el DNI de tu perfil.');
    }

    try {
        require_once __DIR__ . '/../config/database.php';
        $stmt = $pdo->prepare('SELECT nombre, telefono FROM clientes WHERE dni = ?');
        $stmt->execute([$dniCliente]);
        $cliente = $stmt->fetch();
    } catch (Throwable $e) {
        error_log('Error al validar cliente antes del OTP: ' . $e->getMessage());
        responder(500, false, 'No se pudieron validar los datos del cliente.');
    }

    $nombreRegistrado = trim((string)($cliente['nombre'] ?? ''));
    $nombreIngresado = trim($nombreCliente);
    if (function_exists('mb_strtolower')) {
        $nombreRegistrado = mb_strtolower($nombreRegistrado, 'UTF-8');
        $nombreIngresado = mb_strtolower($nombreIngresado, 'UTF-8');
    } else {
        $nombreRegistrado = strtolower($nombreRegistrado);
        $nombreIngresado = strtolower($nombreIngresado);
    }

    if (
        !$cliente ||
        $nombreRegistrado !== $nombreIngresado ||
        normalizarTelefono((string)($cliente['telefono'] ?? '')) !== $telefonoNormalizado
    ) {
        responder(422, false, 'El nombre, DNI y teléfono deben coincidir con los datos registrados en tu perfil.');
    }

    $contexto = ['dni_cliente' => $dniCliente, 'nombre_cliente' => trim($cliente['nombre'])];
}

try {
    // Guarda el código con vencimiento y lo envía al proveedor WhatsApp.
    $codigo = generarCodigoOtp();
    guardarOtp($telefonoNormalizado, $codigo, 300, $contexto);
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

// Informa fallos del proveedor o confirma la entrega del código.
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
