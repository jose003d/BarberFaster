<?php

// Verifica un OTP y, si es válido, emite un ticket temporal de autorización.

declare(strict_types=1);

// Carga helpers compartidos para datos, códigos, tickets y respuesta HTTP.
require_once __DIR__ . '/comun.php';

// Prepara CORS y procesa preflight antes de leer el cuerpo de la solicitud.
setCorsHeaders();
manejarPreflight();

$datos = obtenerJsonBody();
$telefono = obtenerTexto($datos, 'telefono');
$codigoIngresado = obtenerTexto($datos, 'codigo');

// Valida la presencia del código y el formato del número asociado.
if ($telefono === '' || $codigoIngresado === '') {
    responder(400, false, 'Faltan datos para verificar el código.');
}

$telefonoNormalizado = normalizarTelefono($telefono);
if (!telefonoValido($telefonoNormalizado)) {
    responder(422, false, 'El número de teléfono no es válido.');
}

$otp = leerOtpDesdeTelefono($telefonoNormalizado);
// Rechaza códigos inexistentes, expirados o que superan los intentos permitidos.
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
    // Conserva el intento incorrecto antes de devolver el error.
    $otp['intentos'] = $intentos + 1;
    $ruta = rutaArchivoOtp($telefonoNormalizado);
    file_put_contents($ruta, json_encode($otp, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    responder(401, false, 'El código ingresado es incorrecto.');
}

try {
    // Emite un ticket de un solo uso asociado al teléfono ya comprobado.
    $ticket = crearTicketVerificacionTelefono($telefonoNormalizado);
} catch (Throwable $e) {
    responder(500, false, 'No se pudo guardar la verificación del teléfono.');
}

// Consume el OTP para impedir que se vuelva a verificar.
unlink(rutaArchivoOtp($telefonoNormalizado));
responder(200, true, 'Código verificado exitosamente.', [
    'valido' => true,
    'telefono' => $telefonoNormalizado,
    'ticket_verificacion' => $ticket,
]);
