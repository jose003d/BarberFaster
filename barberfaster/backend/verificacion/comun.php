<?php

declare(strict_types=1);

// Configura CORS, procesa JSON y centraliza utilidades de OTP, tickets y Wuapi.

// Devuelve cabeceras CORS solo a orígenes permitidos y define el formato JSON.
function setCorsHeaders(): void
{
    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
    $permitidos = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

    if ($origen !== '' && in_array($origen, $permitidos, true)) {
        header("Access-Control-Allow-Origin: $origen");
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
}

// Estandariza el cuerpo/status HTTP de las respuestas y termina el endpoint.
function responder(int $codigoHttp, bool $exito, string $mensaje, array $extra = []): void
{
    http_response_code($codigoHttp);

    $respuesta = [
        'status' => $exito ? 'success' : 'error',
        'mensaje' => $mensaje,
    ];

    foreach ($extra as $clave => $valor) {
        $respuesta[$clave] = $valor;
    }

    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

// Lee el cuerpo JSON y extrae valores de texto ya recortados.
function obtenerJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function obtenerTexto(array $datos, string $clave): string
{
    $valor = $datos[$clave] ?? '';
    return is_string($valor) ? trim($valor) : trim((string) $valor);
}

// Convierte formatos de teléfono a la representación internacional colombiana.
function normalizarTelefono(string $telefono): string
{
    $telefono = preg_replace('/\D+/', '', $telefono) ?? '';

    if ($telefono === '') {
        return '';
    }

    if (strlen($telefono) === 10) {
        return '57' . ltrim($telefono, '0');
    }

    if (strlen($telefono) === 11 && str_starts_with($telefono, '1')) {
        return '57' . substr($telefono, 1);
    }

    if (strlen($telefono) === 12 && str_starts_with($telefono, '57')) {
        return $telefono;
    }

    if (strlen($telefono) >= 13 && str_starts_with($telefono, '0057')) {
        return '57' . substr($telefono, 4);
    }

    return $telefono;
}

// Acepta únicamente números que cumplen el patrón telefónico admitido.
function telefonoValido(string $telefono): bool
{
    $telefono = normalizarTelefono($telefono);
    return preg_match('/^57\d{9,10}$/', $telefono) === 1;
}

// Guarda un ticket aleatorio vinculado al teléfono con fecha de expiración.
function crearTicketVerificacionTelefono(string $telefono, int $ttlSegundos = 600): string
{
    $ticket = bin2hex(random_bytes(32));
    $ruta = rutaTicketVerificacion($ticket);
    $datos = [
        'telefono' => normalizarTelefono($telefono),
        'expira_en' => time() + $ttlSegundos,
    ];

    $bytes = file_put_contents($ruta, json_encode($datos, JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($bytes === false) {
        throw new RuntimeException('No se pudo guardar la verificación del teléfono.');
    }

    return $ticket;
}

// Calcula la ruta segura del archivo temporal asociado al ticket.
function rutaTicketVerificacion(string $ticket): string
{
    return sys_get_temp_dir() . '/wuapi_verificado_' . hash('sha256', $ticket) . '.json';
}

// Bloquea el archivo del ticket y valida formato, teléfono y vigencia.
function bloquearTicketVerificacion(string $telefono, string $ticket)
{
    if (preg_match('/^[a-f0-9]{64}$/', $ticket) !== 1) {
        return false;
    }

    $ruta = rutaTicketVerificacion($ticket);
    $archivo = @fopen($ruta, 'r+');
    if ($archivo === false || !flock($archivo, LOCK_EX)) {
        if (is_resource($archivo)) {
            fclose($archivo);
        }
        return false;
    }

    rewind($archivo);
    $datos = json_decode(stream_get_contents($archivo), true);
    if (
        !is_array($datos) ||
        !isset($datos['telefono'], $datos['expira_en']) ||
        !hash_equals((string)$datos['telefono'], normalizarTelefono($telefono)) ||
        (int)$datos['expira_en'] < time()
    ) {
        flock($archivo, LOCK_UN);
        fclose($archivo);
        return false;
    }

    return ['archivo' => $archivo, 'ruta' => $ruta];
}

// Invalida y elimina el ticket ya utilizado, liberando su bloqueo.
function consumirTicketVerificacion(array $ticketBloqueado): bool
{
    $archivo = $ticketBloqueado['archivo'];
    $ruta = $ticketBloqueado['ruta'];
    $eliminado = ftruncate($archivo, 0) && fflush($archivo);
    if ($eliminado && is_file($ruta)) {
        $eliminado = unlink($ruta);
    }

    flock($archivo, LOCK_UN);
    fclose($archivo);
    return $eliminado;
}

function crearSesionCliente(string $dni, string $nombre, string $telefono, int $ttlSegundos = 1800): string
{
    $token = bin2hex(random_bytes(32));
    $ruta = rutaSesionCliente($token);
    $datos = [
        'dni' => trim($dni),
        'nombre' => trim($nombre),
        'telefono' => normalizarTelefono($telefono),
        'expira_en' => time() + $ttlSegundos,
    ];

    $bytes = file_put_contents($ruta, json_encode($datos, JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($bytes === false) {
        throw new RuntimeException('No se pudo guardar la sesión del cliente.');
    }

    return $token;
}

function rutaSesionCliente(string $token): string
{
    return sys_get_temp_dir() . '/barberfaster_cliente_' . hash('sha256', $token) . '.json';
}

function leerSesionCliente(): array|false
{
    $cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($cabecera === '' && function_exists('getallheaders')) {
        $cabeceras = getallheaders();
        $cabecera = $cabeceras['Authorization'] ?? $cabeceras['authorization'] ?? '';
    }
    if (!is_string($cabecera) || preg_match('/^Bearer ([a-f0-9]{64})$/', $cabecera, $coincidencias) !== 1) {
        return false;
    }

    $ruta = rutaSesionCliente($coincidencias[1]);
    $contenido = @file_get_contents($ruta);
    if (!is_string($contenido)) {
        return false;
    }

    $sesion = json_decode($contenido, true);
    if (
        !is_array($sesion) ||
        !isset($sesion['dni'], $sesion['nombre'], $sesion['telefono'], $sesion['expira_en']) ||
        (int)$sesion['expira_en'] < time()
    ) {
        if (is_file($ruta)) {
            unlink($ruta);
        }
        return false;
    }

    return $sesion;
}

function obtenerClienteAutenticado(PDO $pdo): array|false
{
    $sesion = leerSesionCliente();
    if ($sesion === false) {
        return false;
    }

    $stmt = $pdo->prepare('SELECT dni, nombre, telefono FROM clientes WHERE dni = ?');
    $stmt->execute([$sesion['dni']]);
    $cliente = $stmt->fetch();
    $nombreCliente = trim((string)($cliente['nombre'] ?? ''));
    $nombreSesion = trim((string)$sesion['nombre']);
    if (function_exists('mb_strtolower')) {
        $nombreCliente = mb_strtolower($nombreCliente, 'UTF-8');
        $nombreSesion = mb_strtolower($nombreSesion, 'UTF-8');
    } else {
        $nombreCliente = strtolower($nombreCliente);
        $nombreSesion = strtolower($nombreSesion);
    }
    if (
        !$cliente ||
        normalizarTelefono((string)($cliente['telefono'] ?? '')) !== $sesion['telefono'] ||
        $nombreCliente !== $nombreSesion
    ) {
        return false;
    }

    return $cliente;
}

// Libera un ticket bloqueado sin consumirlo.
function liberarTicketVerificacion(array $ticketBloqueado): void
{
    $archivo = $ticketBloqueado['archivo'];
    flock($archivo, LOCK_UN);
    fclose($archivo);
}

// Calcula la ruta temporal de almacenamiento para el OTP del teléfono.
function rutaArchivoOtp(string $telefono): string
{
    $telefono = normalizarTelefono($telefono);
    return sys_get_temp_dir() . '/otp_' . md5($telefono) . '.json';
}

// Lee una credencial de entorno obligatoria y genera error si no está definida.
function credencialWuapi(string $nombre): string
{
    $valor = getenv($nombre) ?: $_ENV[$nombre] ?? '';
    if (is_string($valor)) {
        $valor = trim($valor);
    }

    if (!is_string($valor) || $valor === '') {
        throw new RuntimeException("Falta la variable de entorno {$nombre}.");
    }

    return $valor;
}

// Envía el OTP a través de Wuapi y normaliza la respuesta o el error recibido.
function enviarMensajeWuapi(string $telefono, string $codigo): array
{
    if (!function_exists('curl_init')) {
        return [
            'ok' => false,
            'mensaje' => 'La extensión cURL de PHP no está habilitada. Actívala en php.ini.',
            'http_code' => 500,
            'body' => null,
        ];
    }

    $accountId = credencialWuapi('WUAPI_ACCOUNT_ID');
    $apiKey = credencialWuapi('WUAPI_API_KEY');

    $payload = [
        'accountId' => $accountId,
        'to' => $telefono,
        'type' => 'text',
        'text' => "Tu código de verificación es *{$codigo}*. Válido por 5 minutos.",
    ];

    $ch = curl_init('https://api.wuapi.dev/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $respuesta = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($respuesta === false || $httpCode >= 400 || $httpCode === 0) {
        $errorProveedor = is_string($respuesta) ? json_decode($respuesta, true) : null;
        $codigoProveedor = '';
        if (is_array($errorProveedor)) {
            $errorCampo = $errorProveedor['error'] ?? null;
            $codigoProveedor = is_string($errorCampo)
                ? $errorCampo
                : (is_array($errorCampo) ? (string)($errorCampo['code'] ?? '') : '');
            if ($codigoProveedor === '') {
                $codigoProveedor = (string)($errorProveedor['code'] ?? '');
            }
        }

        return [
            'ok' => false,
            'mensaje' => $error !== '' ? $error : 'No se pudo enviar el mensaje por Wuapi.',
            'http_code' => $httpCode,
            'provider_code' => preg_match('/^[a-z0-9_]{1,80}$/i', $codigoProveedor) === 1 ? $codigoProveedor : null,
        ];
    }

    $body = json_decode($respuesta, true);

    return [
        'ok' => true,
        'mensaje' => 'Mensaje enviado correctamente.',
        'body' => is_array($body) ? $body : ['raw' => $respuesta],
    ];
}

// Genera un código OTP numérico de seis dígitos con aleatoriedad segura.
function generarCodigoOtp(): string
{
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Carga del almacenamiento temporal el OTP vigente asociado a un teléfono.
function leerOtpDesdeTelefono(string $telefono): ?array
{
    $ruta = rutaArchivoOtp($telefono);
    if (!is_file($ruta)) {
        return null;
    }

    $contenido = file_get_contents($ruta);
    if ($contenido === false) {
        return null;
    }

    $datos = json_decode($contenido, true);
    return is_array($datos) ? $datos : null;
}

// Persiste OTP, expiración e intentos iniciales en el almacenamiento temporal.
function guardarOtp(string $telefono, string $codigo, int $ttlSegundos = 300, array $contexto = []): void
{
    $ruta = rutaArchivoOtp($telefono);
    $datos = [
        'telefono' => normalizarTelefono($telefono),
        'codigo' => $codigo,
        'expira_en' => time() + $ttlSegundos,
        'intentos' => 0,
        'creado_en' => time(),
    ];
    if ($contexto !== []) {
        $datos['contexto'] = $contexto;
    }

    $bytes = file_put_contents($ruta, json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    if ($bytes === false) {
        throw new RuntimeException('No se pudo guardar el código temporal.');
    }
}

// Elimina el OTP vencido y señala si la expiración ocurrió.
function expirarOtpSiEsNecesario(string $telefono): bool
{
    $datos = leerOtpDesdeTelefono($telefono);
    if (!is_array($datos)) {
        return false;
    }

    $expiraEn = (int) ($datos['expira_en'] ?? 0);
    if ($expiraEn > 0 && time() > $expiraEn) {
        unlink(rutaArchivoOtp($telefono));
        return true;
    }

    return false;
}

// Finaliza rápidamente la solicitud preflight OPTIONS.
function manejarPreflight(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
