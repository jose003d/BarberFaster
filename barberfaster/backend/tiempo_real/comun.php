<?php
// Avisos en tiempo real con el servidor WebSocket propio (carpeta servidor-tiempo-real/).
//
// El hosting compartido no puede mantener conexiones WebSocket abiertas, así que el
// servidor Node corre aparte (en el VPS o en tu computador). PHP le avisa por HTTP
// y él reenvía el aviso por WebSocket al navegador del barbero.
//
// Variables del .env (si faltan, la agenda sigue funcionando consultando cada 15 s):
//   TIEMPO_REAL_WS_URL        URL pública para el navegador, p. ej. wss://tiempo-real.midominio.com/ws
//   TIEMPO_REAL_PUBLICAR_URL  URL donde PHP publica, p. ej. https://tiempo-real.midominio.com/publicar
//   TIEMPO_REAL_SECRETO       el mismo secreto que usa el servidor Node (mínimo 32 caracteres)
//
// Al aviso solo viajan el ID de la cita, la fecha, la hora y el estado; nunca datos del cliente.

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

// Horas que dura el permiso de un navegador para escuchar su canal.
const TIEMPO_REAL_DURACION_TOKEN = 12 * 3600;

function tiempoRealConfiguracion(): ?array
{
    $config = [
        'ws_url' => configValor('TIEMPO_REAL_WS_URL'),
        'publicar_url' => configValor('TIEMPO_REAL_PUBLICAR_URL'),
        'secreto' => configValor('TIEMPO_REAL_SECRETO'),
    ];

    if (
        !$config['ws_url'] || !preg_match('#^wss?://#i', $config['ws_url'])
        || !$config['publicar_url'] || !preg_match('#^https?://#i', $config['publicar_url'])
        || !$config['secreto'] || strlen($config['secreto']) < 32
    ) {
        return null;
    }

    return $config;
}

function tiempoRealCanalBarbero(int $idBarbero): string
{
    return 'barbero-' . $idBarbero;
}

function tiempoRealBase64Url(string $datos): string
{
    return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
}

// Permiso firmado para que un navegador escuche solo el canal de ese barbero.
function tiempoRealToken(int $idBarbero): ?string
{
    $config = tiempoRealConfiguracion();
    if ($config === null) {
        return null;
    }

    $carga = tiempoRealBase64Url((string) json_encode([
        'canal' => tiempoRealCanalBarbero($idBarbero),
        'exp' => time() + TIEMPO_REAL_DURACION_TOKEN,
    ]));
    $firma = tiempoRealBase64Url(hash_hmac('sha256', $carga, $config['secreto'], true));

    return $carga . '.' . $firma;
}

// Envía un evento al servidor WebSocket. Nunca lanza excepciones: si falla, se registra.
function tiempoRealPublicar(string $canal, string $evento, array $datos): bool
{
    $config = tiempoRealConfiguracion();
    if ($config === null || !function_exists('curl_init')) {
        return false;
    }

    try {
        $curl = curl_init($config['publicar_url']);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['canal' => $canal, 'evento' => $evento, 'datos' => $datos]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $config['secreto'],
            ],
            CURLOPT_RETURNTRANSFER => true,
            // La reserva no debe quedarse esperando al servidor de avisos.
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 3,
        ]);
        $respuesta = curl_exec($curl);
        $codigo = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $errorCurl = curl_error($curl);
        curl_close($curl);

        if ($respuesta === false || $codigo < 200 || $codigo >= 300) {
            error_log("El servidor de tiempo real no aceptó {$evento} (HTTP {$codigo}): " . ($errorCurl ?: (string) $respuesta));
            return false;
        }
        return true;
    } catch (Throwable $error) {
        error_log('No se pudo publicar el aviso en tiempo real: ' . $error->getMessage());
        return false;
    }
}

/**
 * Avisa al barbero que una de sus citas se creó o cambió.
 * Se llama DESPUÉS del commit, para que el barbero no vea una cita que luego se revierte.
 * $motivo: CREADA, CONFIRMADA, CANCELADA, COMPLETADA o REPROGRAMADA.
 */
function notificarCambioCita(PDO $pdo, int $idCita, string $motivo): void
{
    if (tiempoRealConfiguracion() === null) {
        return;
    }

    try {
        $stmt = $pdo->prepare('SELECT id_barbero, fecha, hora_inicio, estado FROM citas WHERE id_cita = ?');
        $stmt->execute([$idCita]);
        $cita = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cita) {
            return;
        }

        tiempoRealPublicar(tiempoRealCanalBarbero((int) $cita['id_barbero']), 'cita-actualizada', [
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
