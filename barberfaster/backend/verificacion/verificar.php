<?php

declare(strict_types=1);

require_once __DIR__ . '/comun.php';

setCorsHeaders();
manejarPreflight();

$datos = obtenerJsonBody();
$telefono = obtenerTexto($datos, 'telefono');
$codigoIngresado = obtenerTexto($datos, 'codigo');

if ($telefono === '' || $codigoIngresado === '') {
    responder(400, false, 'Faltan datos para verificar el código.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido.');
}

$otp = leerOtpDesdeTelefono($telefonoNormalizado);
if (!is_array($otp)) {
    responder(404, false, 'No existe un código activo para este teléfono. Solicita uno nuevo.');
}

if (expirarOtpSiEsNecesario($telefonoNormalizado)) {
    responder(401, false, 'El código ha expirado. Solicita un nuevo código.');
}

$intentos = (int) ($otp['intentos'] ?? 0);
$maxIntentos = 5;
if ($intentos >= $maxIntentos) {
    unlink(rutaArchivoOtp($telefonoNormalizado));
    responder(429, false, 'Demasiados intentos. Solicita un código nuevo.');
}

if (!hash_equals((string) ($otp['codigo'] ?? ''), $codigoIngresado)) {
    $otp['intentos'] = $intentos + 1;
    $ruta = rutaArchivoOtp($telefonoNormalizado);
    file_put_contents($ruta, json_encode($otp, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    responder(401, false, 'El código ingresado es incorrecto.');
}

unlink(rutaArchivoOtp($telefonoNormalizado));
responder(200, true, 'Código verificado exitosamente.', [
    'valido' => true,
    'telefono' => $telefonoNormalizado,
]);
