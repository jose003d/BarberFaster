<?php

declare(strict_types=1);

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

function telefonoValido(string $telefono): bool
{
    $telefono = normalizarTelefono($telefono);
    return preg_match('/^57\d{9,10}$/', $telefono) === 1;
}

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

function rutaTicketVerificacion(string $ticket): string
{
    return sys_get_temp_dir() . '/wuapi_verificado_' . hash('sha256', $ticket) . '.json';
}

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

function liberarTicketVerificacion(array $ticketBloqueado): void
{
    $archivo = $ticketBloqueado['archivo'];
    flock($archivo, LOCK_UN);
    fclose($archivo);
}

function rutaArchivoOtp(string $telefono): string
{
    $telefono = normalizarTelefono($telefono);
    return sys_get_temp_dir() . '/otp_' . md5($telefono) . '.json';
}

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

function generarCodigoOtp(): string
{
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

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

function guardarOtp(string $telefono, string $codigo, int $ttlSegundos = 300): void
{
    $ruta = rutaArchivoOtp($telefono);
    $datos = [
        'telefono' => normalizarTelefono($telefono),
        'codigo' => $codigo,
        'expira_en' => time() + $ttlSegundos,
        'intentos' => 0,
        'creado_en' => time(),
    ];

    $bytes = file_put_contents($ruta, json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    if ($bytes === false) {
        throw new RuntimeException('No se pudo guardar el código temporal.');
    }
}

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

function manejarPreflight(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
