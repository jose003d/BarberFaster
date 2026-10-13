<?php

// Comprueba el código temporal de un cliente y limita los intentos fallidos.

declare(strict_types=1);

// Reutiliza las funciones compartidas de verificación telefónica.
require_once __DIR__ . '/../verificacion/comun.php';

// Configura CORS y responde a preflight antes de procesar el cuerpo.
setCorsHeaders();
manejarPreflight();

$data = obtenerJsonBody();
$telefono = obtenerTexto($data, 'telefono');
$codigoIngresado = obtenerTexto($data, 'codigo');

// Valida el formato del número y exige el código recibido.
if ($telefono === '' || $codigoIngresado === '') {
    responder(400, false, 'Faltan datos para verificar el código.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido.');
}

$otp = leerOtpDesdeTelefono($telefonoNormalizado);
// Rechaza códigos inexistentes, vencidos o bloqueados por superar intentos.
if (!is_array($otp)) {
    responder(404, false, 'No existe un código activo para este teléfono. Solicita uno nuevo.');
}

if (expirarOtpSiEsNecesario($telefonoNormalizado)) {
    responder(401, false, 'El código ha expirado. Solicita un nuevo código.');
}

$intentos = (int) ($otp['intentos'] ?? 0);
if ($intentos >= 5) {
    unlink(rutaArchivoOtp($telefonoNormalizado));
    responder(429, false, 'Demasiados intentos. Solicita un código nuevo.');
}

if (!hash_equals((string) ($otp['codigo'] ?? ''), $codigoIngresado)) {
    // Persiste el intento incorrecto para aplicar el límite en las consultas siguientes.
    $otp['intentos'] = $intentos + 1;
    $ruta = rutaArchivoOtp($telefonoNormalizado);
    file_put_contents($ruta, json_encode($otp, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    responder(401, false, 'El código ingresado es incorrecto.');
}

// Elimina el código al usarlo y confirma que el número fue verificado.
unlink(rutaArchivoOtp($telefonoNormalizado));
responder(200, true, 'Código verificado exitosamente.', [
    'valido' => true,
    'telefono' => $telefonoNormalizado,
]);