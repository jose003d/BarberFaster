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
$dniCliente = obtenerTexto($datos, 'dni_cliente');
$nombreCliente = obtenerTexto($datos, 'nombre_cliente');

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

 $contextoOtp = $otp['contexto'] ?? null;
if (is_array($contextoOtp) && ($dniCliente !== '' || $nombreCliente !== '')) {
    if (
        !isset($contextoOtp['dni_cliente'], $contextoOtp['nombre_cliente']) ||
        !hash_equals((string)$contextoOtp['dni_cliente'], $dniCliente)
    ) {
        responder(403, false, 'Los datos cambiaron después de solicitar el código. Solicita uno nuevo con tus datos registrados.');
    }
    $nombreOtp = trim((string)$contextoOtp['nombre_cliente']);
    $nombreSolicitado = trim($nombreCliente);
    if (function_exists('mb_strtolower')) {
        $nombreOtp = mb_strtolower($nombreOtp, 'UTF-8');
        $nombreSolicitado = mb_strtolower($nombreSolicitado, 'UTF-8');
    } else {
        $nombreOtp = strtolower($nombreOtp);
        $nombreSolicitado = strtolower($nombreSolicitado);
    }
    if ($nombreOtp !== $nombreSolicitado) {
        responder(403, false, 'Los datos cambiaron después de solicitar el código. Solicita uno nuevo con tus datos registrados.');
    }
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
    $sesionCliente = null;
    if (is_array($contextoOtp) && $dniCliente !== '' && $nombreCliente !== '') {
        $sesionCliente = crearSesionCliente(
            (string)$contextoOtp['dni_cliente'],
            (string)$contextoOtp['nombre_cliente'],
            $telefonoNormalizado
        );
    }
} catch (Throwable $e) {
    error_log('Error al guardar verificación o sesión de cliente: ' . $e->getMessage());
    responder(500, false, 'No se pudo guardar la verificación del teléfono.');
}

// Consume el OTP para impedir que se vuelva a verificar.
unlink(rutaArchivoOtp($telefonoNormalizado));
responder(200, true, 'Código verificado exitosamente.', [
    'valido' => true,
    'telefono' => $telefonoNormalizado,
    'ticket_verificacion' => $ticket,
    'sesion_cliente' => $sesionCliente,
    'sesion_expira_en' => $sesionCliente !== null ? time() + 1800 : null,
]);
