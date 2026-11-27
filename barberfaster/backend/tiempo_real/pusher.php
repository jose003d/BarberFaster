<?php
// Avisos en tiempo real con Pusher Channels (WebSocket administrado).
//
// El hosting compartido no puede mantener un servidor WebSocket propio, así que PHP
// le avisa a Pusher por HTTP y Pusher reenvía el aviso por WebSocket al navegador
// del barbero. Cada barbero escucha solo su canal privado "private-barbero-{id}".
//
// Configuración en el .env del servidor (si falta, la agenda sigue funcionando
// consultando cada pocos segundos):
//   PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER (por ejemplo "us2")
//
// Al aviso solo viajan el ID de la cita, la fecha y la hora: nunca datos del cliente.
// El navegador, al recibirlo, vuelve a pedir la agenda al backend con su sesión.

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

function pusherConfiguracion(): ?array
{
    $config = [
        'app_id' => configValor('PUSHER_APP_ID'),
        'key' => configValor('PUSHER_KEY'),
        'secret' => configValor('PUSHER_SECRET'),
        'cluster' => configValor('PUSHER_CLUSTER'),
    ];

    foreach ($config as $valor) {
        if ($valor === null || trim($valor) === '') {
            return null;
        }
    }
    if (!preg_match('/^[a-z0-9-]+$/', $config['cluster']) || !ctype_digit($config['app_id'])) {
        return null;
    }

    return $config;
}

function pusherCanalBarbero(int $idBarbero): string
{
    return 'private-barbero-' . $idBarbero;
}

// Publica un evento en Pusher. Nunca lanza excepciones: si falla, solo se registra.
function pusherPublicar(array $canales, string $evento, array $datos): bool
{
    $config = pusherConfiguracion();
    if ($config === null || $canales === [] || !function_exists('curl_init')) {
        return false;
    }

    try {
        $cuerpo = json_encode([
            'name' => $evento,
            'channels' => array_values($canales),
            'data' => json_encode($datos, JSON_UNESCAPED_UNICODE),
        ], JSON_UNESCAPED_UNICODE);

        $ruta = '/apps/' . $config['app_id'] . '/events';
        $parametros = [
            'auth_key' => $config['key'],
            'auth_timestamp' => (string) time(),
            'auth_version' => '1.0',
            'body_md5' => md5($cuerpo),
        ];
        ksort($parametros);
        $consulta = http_build_query($parametros);
        $firma = hash_hmac('sha256', "POST\n{$ruta}\n{$consulta}", $config['secret']);
        $url = 'https://api-' . $config['cluster'] . '.pusher.com' . $ruta . '?' . $consulta . '&auth_signature=' . $firma;

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $cuerpo,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            // La reserva no debe quedarse esperando a Pusher.
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 3,
        ]);
        $respuesta = curl_exec($curl);
        $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $errorCurl = curl_error($curl);
        curl_close($curl);

        if ($respuesta === false || $codigo < 200 || $codigo >= 300) {
            error_log("Pusher no aceptó el evento {$evento} (HTTP {$codigo}): " . ($errorCurl ?: (string) $respuesta));
            return false;
        }
        return true;
    } catch (Throwable $error) {
        error_log('No se pudo publicar el evento en Pusher: ' . $error->getMessage());
        return false;
    }
}

/**
 * Avisa al barbero de una cita que esta se creó o cambió.
 * Se llama DESPUÉS del commit, para que el barbero no vea una cita que luego se revierte.
 * $motivo: CREADA, CONFIRMADA, CANCELADA, COMPLETADA o REPROGRAMADA.
 */
function notificarCambioCita(PDO $pdo, int $idCita, string $motivo): void
{
    if (pusherConfiguracion() === null) {
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT id_barbero, fecha, hora_inicio, estado FROM citas WHERE id_cita = ?');
        $stmt->execute([$idCita]);
        $cita = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cita) {
            return;
        }

        pusherPublicar([pusherCanalBarbero((int) $cita['id_barbero'])], 'cita-actualizada', [
            'id_cita' => $idCita,
            'motivo' => $motivo,
            'estado' => $cita['estado'],
            'fecha' => $cita['fecha'],
            'hora_inicio' => substr((string) $cita['hora_inicio'], 0, 5),
        ]);
    } catch (Throwable $error) {
        error_log('No se pudo avisar el cambio de la cita: ' . $error->getMessage());
    }
}

// Firma la suscripción de un navegador a un canal privado (protocolo de Pusher).
function pusherFirmarSuscripcion(string $socketId, string $canal): ?string
{
    $config = pusherConfiguracion();
    if ($config === null) {
        return null;
    }

    return $config['key'] . ':' . hash_hmac('sha256', "{$socketId}:{$canal}", $config['secret']);
}
