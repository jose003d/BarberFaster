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
if (!telefonoValido($telefono)) {
    responder(422, false, 'El número de teléfono no es válido.');
}
if (!preg_match('/^\d{6}$/', $codigoIngresado)) {
    responder(422, false, 'El código debe tener 6 dígitos.');
}
if (($dniCliente === '') !== ($nombreCliente === '')) {
    responder(400, false, 'Ingresa el DNI y el nombre del cliente.');
}
if (($dniCliente !== '' && !preg_match('/^\d{1,10}$/', $dniCliente)) || longitudCaracteres($nombreCliente) > 100) {
    responder(422, false, 'El DNI debe tener máximo 10 dígitos y el nombre no puede superar 100 caracteres.');
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

if (is_array($contextoOtp) && isset($contextoOtp['dni_cliente'], $contextoOtp['nombre_cliente'])) {
    if ($dniCliente === '' || $nombreCliente === '') {
        responder(400, false, 'Faltan el DNI y el nombre del cliente.');
    }

    $nombreOtp = trim((string)$contextoOtp['nombre_cliente']);
    $nombreSolicitado = trim($nombreCliente);
    if (function_exists('mb_strtolower')) {
        $nombreCoincide = mb_strtolower($nombreOtp, 'UTF-8') === mb_strtolower($nombreSolicitado, 'UTF-8');
    } else {
        $nombreCoincide = strtolower($nombreOtp) === strtolower($nombreSolicitado);
    }
    if (!hash_equals((string)$contextoOtp['dni_cliente'], $dniCliente) || !$nombreCoincide) {
        responder(403, false, 'Los datos cambiaron después de solicitar el código. Solicita uno nuevo.');
    }

    try {
        require_once __DIR__ . '/../config/database.php';
        $pdo->beginTransaction();
        $stmtCliente = $pdo->prepare('SELECT telefono FROM clientes WHERE dni = ? FOR UPDATE');
        $stmtCliente->execute([$dniCliente]);
        $cliente = $stmtCliente->fetch();
        if (!$cliente || normalizarTelefono((string)$cliente['telefono']) !== $telefonoNormalizado) {
            $pdo->rollBack();
            responder(403, false, 'El DNI o el teléfono ya no coinciden con el registro del cliente.');
        }

        $stmtActualizarNombre = $pdo->prepare('UPDATE clientes SET nombre = ? WHERE dni = ?');
        $stmtActualizarNombre->execute([trim((string)$contextoOtp['nombre_cliente']), $dniCliente]);
        $pdo->commit();
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Error al actualizar el nombre al iniciar sesión del cliente: ' . $e->getMessage());
        responder(500, false, 'No se pudo actualizar el nombre del perfil.');
    }
}

try {
    // Emite un ticket de un solo uso asociado al teléfono ya comprobado.
    $ticket = crearTicketVerificacionTelefono($telefonoNormalizado);
    $sesionCliente = null;
    if ($dniCliente !== '' && $nombreCliente !== '') {
        $dniSesion = is_array($contextoOtp)
            ? (string)$contextoOtp['dni_cliente']
            : $dniCliente;
        $nombreSesion = is_array($contextoOtp)
            ? (string)$contextoOtp['nombre_cliente']
            : $nombreCliente;
        $sesionCliente = crearSesionCliente(
            $dniSesion,
            $nombreSesion,
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
