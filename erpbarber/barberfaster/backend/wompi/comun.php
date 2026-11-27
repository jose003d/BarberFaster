<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/cifrado.php';
require_once __DIR__ . '/../tiempo_real/pusher.php';

// Cada barbería cobra con su propia cuenta de Wompi: el dinero de sus clientes
// llega directo a ella. Sus llaves se guardan en barberia_pasarelas y los
// secretos van cifrados con PAGOS_CLAVE_CIFRADO (ver config/cifrado.php).
// La plataforma solo define WOMPI_REDIRECT_URL, común a todas las barberías.

const WOMPI_PREFIJOS = [
    'sandbox' => [
        'llave_publica' => 'pub_test_',
        'llave_privada' => 'prv_test_',
        'secreto_integridad' => 'test_integrity_',
        'secreto_eventos' => 'test_events_',
    ],
    'production' => [
        'llave_publica' => 'pub_prod_',
        'llave_privada' => 'prv_prod_',
        'secreto_integridad' => 'prod_integrity_',
        'secreto_eventos' => 'prod_events_',
    ],
];

// Nombres que se muestran al validar cada llave.
const WOMPI_NOMBRES_LLAVES = [
    'llave_publica' => 'La llave pública',
    'llave_privada' => 'La llave privada',
    'secreto_integridad' => 'El secreto de integridad',
    'secreto_eventos' => 'El secreto de eventos',
];

function wompiUrlRedireccion(): string
{
    $url = getenv('WOMPI_REDIRECT_URL');
    if (
        !is_string($url)
        || !filter_var($url, FILTER_VALIDATE_URL)
        || !in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)
    ) {
        throw new RuntimeException('Falta configurar WOMPI_REDIRECT_URL en el servidor.');
    }

    return $url;
}

function wompiBaseApi(string $ambiente): string
{
    return $ambiente === 'production'
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1';
}

// Devuelve el primer error de formato de las llaves, o null si están bien.
// Solo valida las llaves presentes en $llaves.
function wompiErrorFormatoLlaves(string $ambiente, array $llaves): ?string
{
    if (!isset(WOMPI_PREFIJOS[$ambiente])) {
        return 'El ambiente debe ser "sandbox" (pruebas) o "production" (cobros reales).';
    }

    foreach ($llaves as $campo => $valor) {
        $prefijo = WOMPI_PREFIJOS[$ambiente][$campo] ?? null;
        if ($prefijo === null) {
            continue;
        }
        if (!is_string($valor) || !preg_match('/^[A-Za-z0-9_]{10,200}$/', $valor)) {
            return WOMPI_NOMBRES_LLAVES[$campo] . ' no tiene un formato válido.';
        }
        if (!str_starts_with($valor, $prefijo)) {
            $nombreAmbiente = $ambiente === 'production' ? 'producción' : 'pruebas';
            return WOMPI_NOMBRES_LLAVES[$campo] . " no corresponde al ambiente de {$nombreAmbiente} (debe empezar por {$prefijo}).";
        }
    }

    return null;
}

function wompiContextoSecreto(int $idBarberia, string $campo): string
{
    return "barberia:{$idBarberia}:wompi:{$campo}";
}

// Fila guardada de la barbería, sin descifrar secretos.
function wompiFilaBarberia(PDO $pdo, int $idBarberia): ?array
{
    $stmt = $pdo->prepare("
        SELECT id_barberia, ambiente, llave_publica, llave_privada_cifrada,
               secreto_integridad_cifrado, secreto_eventos_cifrado, activo, validado_en
        FROM barberia_pasarelas
        WHERE id_barberia = :id_barberia AND proveedor = 'WOMPI'
    ");
    $stmt->execute([':id_barberia' => $idBarberia]);
    $fila = $stmt->fetch(PDO::FETCH_ASSOC);

    return $fila ?: null;
}

// Indica si los clientes de la barbería pueden pagar en línea. Nunca lanza:
// ante cualquier problema la barbería solo ofrece pago en el local.
function wompiBarberiaAceptaPagosEnLinea(PDO $pdo, int $idBarberia): bool
{
    try {
        wompiConfiguracionBarberia($pdo, $idBarberia);
        wompiUrlRedireccion();
        return true;
    } catch (Throwable $error) {
        return false;
    }
}

// Configuración completa (con secretos descifrados) de una barbería.
// Con $exigirActiva = false sirve para verificar pagos ya iniciados aunque la
// barbería haya desactivado el pago en línea después.
function wompiConfiguracionBarberia(PDO $pdo, int $idBarberia, bool $exigirActiva = true): array
{
    $fila = wompiFilaBarberia($pdo, $idBarberia);
    if ($fila === null || ($exigirActiva && (int) $fila['activo'] !== 1)) {
        throw new RuntimeException("La barbería {$idBarberia} no tiene pagos en línea activos.");
    }

    $config = [
        'id_barberia' => $idBarberia,
        'ambiente' => $fila['ambiente'],
        'llave_publica' => $fila['llave_publica'],
        'llave_privada' => descifrarSecreto($fila['llave_privada_cifrada'], wompiContextoSecreto($idBarberia, 'llave_privada')),
        'secreto_integridad' => descifrarSecreto($fila['secreto_integridad_cifrado'], wompiContextoSecreto($idBarberia, 'secreto_integridad')),
        'secreto_eventos' => descifrarSecreto($fila['secreto_eventos_cifrado'], wompiContextoSecreto($idBarberia, 'secreto_eventos')),
    ];

    $error = wompiErrorFormatoLlaves($config['ambiente'], array_intersect_key($config, WOMPI_NOMBRES_LLAVES));
    if ($error !== null) {
        throw new RuntimeException("Configuración de Wompi inválida en la barbería {$idBarberia}: {$error}");
    }

    return $config;
}

function wompiCrearReferencia(PDO $pdo, int $idCita, int $idBarberia, int $montoCentavos): array
{
    $config = wompiConfiguracionBarberia($pdo, $idBarberia);
    $urlBase = wompiUrlRedireccion();
    $referencia = sprintf('BF-%d-%s', $idCita, bin2hex(random_bytes(8)));
    $separador = str_contains($urlBase, '?') ? '&' : '?';
    $urlRedireccion = $urlBase
        . $separador
        . 'barberia='
        . rawurlencode((string) $idBarberia);
    $firma = hash(
        'sha256',
        $referencia . $montoCentavos . 'COP' . $config['secreto_integridad']
    );

    // Se guarda el ambiente del intento: la verificación posterior consulta ese
    // mismo ambiente aunque la barbería cambie sus llaves mientras tanto.
    $stmt = $pdo->prepare("
        INSERT INTO wompi_pagos
            (id_cita, referencia, monto_centavos, moneda, ambiente, estado, expira_en)
        VALUES
            (:id_cita, :referencia, :monto_centavos, 'COP', :ambiente, 'PENDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ");
    $stmt->execute([
        ':id_cita' => $idCita,
        ':referencia' => $referencia,
        ':monto_centavos' => $montoCentavos,
        ':ambiente' => $config['ambiente'],
    ]);

    return [
        'llave_publica' => $config['llave_publica'],
        'referencia' => $referencia,
        'monto_centavos' => $montoCentavos,
        'moneda' => 'COP',
        'firma_integridad' => $firma,
        'url_redireccion' => $urlRedireccion,
        'expira_en' => time() + 600,
    ];
}

// Busca un intento de pago por su referencia, junto con la barbería de la cita.
function wompiPagoPorReferencia(PDO $pdo, string $referencia): ?array
{
    $stmt = $pdo->prepare("
        SELECT p.id_pago, p.ambiente, c.id_barberia
        FROM wompi_pagos p
        INNER JOIN citas c ON c.id_cita = p.id_cita
        WHERE p.referencia = :referencia
    ");
    $stmt->execute([':referencia' => $referencia]);
    $pago = $stmt->fetch(PDO::FETCH_ASSOC);

    return $pago ?: null;
}

function wompiLiberarPagosVencidos(PDO $pdo): void
{
    $pdo->exec("
        UPDATE wompi_pagos p
        INNER JOIN citas c ON c.id_cita = p.id_cita
        SET p.estado = 'EXPIRED',
            p.actualizado_en = CURRENT_TIMESTAMP,
            c.estado = 'CANCELADA'
        WHERE p.estado = 'PENDING'
          AND p.expira_en <= NOW()
          AND c.estado = 'PENDIENTE'
    ");
}

function wompiExtraerPropiedad(array $datos, string $ruta): ?string
{
    $valor = $datos;
    foreach (explode('.', $ruta) as $segmento) {
        if (!is_array($valor) || !array_key_exists($segmento, $valor)) {
            return null;
        }
        $valor = $valor[$segmento];
    }

    return is_scalar($valor) ? (string) $valor : null;
}

function wompiFirmaEventoValida(array $evento, string $secreto): bool
{
    $firma = $evento['signature'] ?? null;
    $datos = $evento['data'] ?? null;
    // Wompi envía "timestamp" en la raíz del evento, junto a "signature".
    $timestamp = $evento['timestamp'] ?? null;
    $propiedades = $firma['properties'] ?? null;
    $checksum = $firma['checksum'] ?? null;

    if (
        !is_array($firma)
        || !is_array($datos)
        || !is_array($propiedades)
        || !is_string($checksum)
        || !is_numeric($timestamp)
    ) {
        return false;
    }

    $partes = [];
    foreach ($propiedades as $propiedad) {
        if (!is_string($propiedad)) {
            return false;
        }
        $valor = wompiExtraerPropiedad($datos, $propiedad);
        if ($valor === null) {
            return false;
        }
        $partes[] = $valor;
    }
    $partes[] = (string) $timestamp;
    $partes[] = $secreto;
    $esperado = hash('sha256', implode('', $partes));

    return hash_equals(strtolower($esperado), strtolower($checksum));
}

// Aplica a la cita el estado de una transacción ya autenticada (firma del
// evento o consulta con la llave privada de $idBarberia). La referencia debe
// pertenecer a esa barbería: así una barbería no puede confirmar citas ajenas.
function wompiAplicarTransaccion(PDO $pdo, array $transaccion, int $idBarberia): array
{
    $idTransaccion = $transaccion['id'] ?? null;
    $referencia = $transaccion['reference'] ?? null;
    $estado = $transaccion['status'] ?? null;
    $montoCentavos = filter_var(
        $transaccion['amount_in_cents'] ?? null,
        FILTER_VALIDATE_INT
    );

    if (
        !is_string($idTransaccion)
        || $idTransaccion === ''
        || !is_string($referencia)
        || $referencia === ''
        || !is_string($estado)
        || $montoCentavos === false
        || ($transaccion['currency'] ?? null) !== 'COP'
    ) {
        throw new RuntimeException('La transacción de Wompi no tiene datos válidos.');
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            SELECT
                p.id_pago,
                p.id_cita,
                p.monto_centavos,
                p.estado AS estado_pago,
                p.expira_en <= NOW() AS expirado,
                p.id_transaccion,
                c.id_barberia,
                c.estado AS estado_cita,
                c.dni_cliente,
                cl.nombre AS nombre_cliente,
                (
                    SELECT GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ')
                    FROM cita_servicios cs
                    INNER JOIN servicios s ON s.id_servicio = cs.id_servicio
                    WHERE cs.id_cita = c.id_cita
                ) AS servicios
            FROM wompi_pagos p
            INNER JOIN citas c ON c.id_cita = p.id_cita
            INNER JOIN clientes cl ON cl.dni = c.dni_cliente
            WHERE p.referencia = :referencia
            FOR UPDATE
        ");
        $stmt->execute([':referencia' => $referencia]);
        $pago = $stmt->fetch(PDO::FETCH_ASSOC);
        if (
            !$pago
            || (int) $pago['id_barberia'] !== $idBarberia
            || (int) $pago['monto_centavos'] !== $montoCentavos
            || ($pago['id_transaccion'] !== null && $pago['id_transaccion'] !== $idTransaccion)
        ) {
            throw new RuntimeException('La referencia o el monto de la transacción no coinciden con la reserva.');
        }

        if (in_array(
            $pago['estado_pago'],
            ['APPROVED', 'LATE_APPROVED', 'DECLINED', 'VOIDED', 'ERROR'],
            true
        )) {
            $pdo->commit();
            return ['estado_pago' => $pago['estado_pago'], 'id_cita' => (int) $pago['id_cita']];
        }
        if ($pago['estado_pago'] === 'EXPIRED' && $estado !== 'APPROVED') {
            $pdo->commit();
            return ['estado_pago' => 'EXPIRED', 'id_cita' => (int) $pago['id_cita']];
        }

        $estadoCita = $pago['estado_cita'];
        $estadoPago = match ($estado) {
            'APPROVED' => ((int) $pago['expirado'] === 1 || $estadoCita === 'CANCELADA')
                ? 'LATE_APPROVED'
                : 'APPROVED',
            'DECLINED' => 'DECLINED',
            'VOIDED' => 'VOIDED',
            'ERROR' => 'ERROR',
            default => 'PENDING',
        };

        $stmtPago = $pdo->prepare("
            UPDATE wompi_pagos
            SET id_transaccion = :id_transaccion,
                estado = :estado,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE id_pago = :id_pago
        ");
        $stmtPago->execute([
            ':id_transaccion' => $idTransaccion,
            ':estado' => $estadoPago,
            ':id_pago' => $pago['id_pago'],
        ]);

        if ($estadoPago === 'APPROVED') {
            $stmtCita = $pdo->prepare("
                UPDATE citas
                SET estado = 'CONFIRMADA'
                WHERE id_cita = :id_cita AND estado = 'PENDIENTE'
            ");
            $stmtCita->execute([':id_cita' => $pago['id_cita']]);
            if ($stmtCita->rowCount() !== 1) {
                throw new RuntimeException('La reserva ya no está disponible para confirmarse.');
            }

            wompiCrearNotificacion(
                $pdo,
                (int) $pago['id_barberia'],
                (int) $pago['id_cita'],
                'PAGO_APROBADO',
                sprintf(
                    'Pago aprobado para la cita #%d de %s. Servicios: %s. Total: $%s COP.',
                    $pago['id_cita'],
                    $pago['nombre_cliente'],
                    $pago['servicios'] ?: 'No especificados',
                    number_format($montoCentavos / 100, 0, ',', '.')
                )
            );
        } elseif ($estadoPago === 'LATE_APPROVED') {
            $stmtCita = $pdo->prepare("
                UPDATE citas
                SET estado = 'CANCELADA'
                WHERE id_cita = :id_cita AND estado = 'PENDIENTE'
            ");
            $stmtCita->execute([':id_cita' => $pago['id_cita']]);

            wompiCrearNotificacion(
                $pdo,
                (int) $pago['id_barberia'],
                (int) $pago['id_cita'],
                'PAGO_TARDIO',
                sprintf(
                    'Wompi aprobó tarde el pago de la cita #%d de %s ($%s COP). La cita no se confirmó; revisa el pago para gestionar el reembolso.',
                    $pago['id_cita'],
                    $pago['nombre_cliente'],
                    number_format($montoCentavos / 100, 0, ',', '.')
                )
            );
        } elseif (in_array($estadoPago, ['DECLINED', 'VOIDED', 'ERROR'], true)) {
            $stmtCita = $pdo->prepare("
                UPDATE citas
                SET estado = 'CANCELADA'
                WHERE id_cita = :id_cita AND estado = 'PENDIENTE'
            ");
            $stmtCita->execute([':id_cita' => $pago['id_cita']]);
        }

        $pdo->commit();
        if (in_array($estadoPago, ['APPROVED', 'LATE_APPROVED', 'DECLINED', 'VOIDED', 'ERROR'], true)) {
            notificarCambioCita($pdo, (int) $pago['id_cita'], $estadoPago === 'APPROVED' ? 'CONFIRMADA' : 'CANCELADA');
        }
        return ['estado_pago' => $estadoPago, 'id_cita' => (int) $pago['id_cita']];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function wompiCrearNotificacion(
    PDO $pdo,
    int $idBarberia,
    int $idCita,
    string $tipo,
    string $mensaje
): void {
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO notificaciones_barberia (id_barberia, id_cita, tipo, mensaje)
        VALUES (:id_barberia, :id_cita, :tipo, :mensaje)
    ");
    $stmt->execute([
        ':id_barberia' => $idBarberia,
        ':id_cita' => $idCita,
        ':tipo' => $tipo,
        ':mensaje' => $mensaje,
    ]);
}

// Consulta la transacción con la llave privada de la barbería. Wompi solo
// devuelve transacciones del comercio dueño de esa llave, así que un pago hecho
// a otra cuenta de Wompi con la misma referencia no se encuentra (HTTP 404).
function wompiConsultarTransaccion(array $config, string $idTransaccion): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('La extensión cURL de PHP debe estar habilitada para verificar pagos.');
    }

    $url = wompiBaseApi($config['ambiente']) . '/transactions/' . rawurlencode($idTransaccion);
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Bearer ' . $config['llave_privada'],
        ],
    ]);
    $contenido = curl_exec($curl);
    $codigoHttp = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $errorCurl = curl_error($curl);
    curl_close($curl);

    if (!is_string($contenido) || $codigoHttp !== 200) {
        throw new RuntimeException(
            $errorCurl !== ''
                ? 'No se pudo consultar la transacción en Wompi.'
                : "Wompi respondió con HTTP {$codigoHttp} al consultar la transacción."
        );
    }

    $respuesta = json_decode($contenido, true);
    if (!is_array($respuesta) || !is_array($respuesta['data'] ?? null)) {
        throw new RuntimeException('Wompi devolvió una respuesta de transacción no válida.');
    }

    return $respuesta['data'];
}
