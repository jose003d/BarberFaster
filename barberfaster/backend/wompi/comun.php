<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

function wompiConfiguracion(): array
{
    $ambiente = getenv('WOMPI_ENV') ?: 'sandbox';
    $llavePublica = getenv('WOMPI_PUBLIC_KEY');
    $secretoIntegridad = getenv('WOMPI_INTEGRITY_SECRET');
    $secretoEventos = getenv('WOMPI_EVENTS_SECRET');
    $urlRedireccion = getenv('WOMPI_REDIRECT_URL');

    if ($ambiente !== 'sandbox') {
        throw new RuntimeException('La integración Wompi está limitada al ambiente sandbox por ahora.');
    }
    if (
        !is_string($llavePublica)
        || !str_starts_with($llavePublica, 'pub_test_')
        || !is_string($secretoIntegridad)
        || $secretoIntegridad === ''
        || !is_string($secretoEventos)
        || $secretoEventos === ''
        || !is_string($urlRedireccion)
        || !filter_var($urlRedireccion, FILTER_VALIDATE_URL)
        || !in_array(parse_url($urlRedireccion, PHP_URL_SCHEME), ['http', 'https'], true)
    ) {
        throw new RuntimeException('Falta configurar WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET, WOMPI_EVENTS_SECRET o WOMPI_REDIRECT_URL.');
    }

    return [
        'ambiente' => $ambiente,
        'llave_publica' => $llavePublica,
        'secreto_integridad' => $secretoIntegridad,
        'secreto_eventos' => $secretoEventos,
        'url_redireccion' => $urlRedireccion,
    ];
}

function wompiCrearReferencia(PDO $pdo, int $idCita, int $idBarberia, int $montoCentavos): array
{
    $config = wompiConfiguracion();
    $referencia = sprintf('BF-%d-%s', $idCita, bin2hex(random_bytes(8)));
    $separador = str_contains($config['url_redireccion'], '?') ? '&' : '?';
    $urlRedireccion = $config['url_redireccion']
        . $separador
        . 'barberia='
        . rawurlencode((string) $idBarberia);
    $firma = hash(
        'sha256',
        $referencia . $montoCentavos . 'COP' . $config['secreto_integridad']
    );

    $stmt = $pdo->prepare("
        INSERT INTO wompi_pagos
            (id_cita, referencia, monto_centavos, moneda, estado, expira_en)
        VALUES
            (:id_cita, :referencia, :monto_centavos, 'COP', 'PENDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ");
    $stmt->execute([
        ':id_cita' => $idCita,
        ':referencia' => $referencia,
        ':monto_centavos' => $montoCentavos,
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
    $timestamp = $firma['timestamp'] ?? null;
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

function wompiAplicarTransaccion(PDO $pdo, array $transaccion): array
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

function wompiConsultarTransaccion(string $idTransaccion): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('La extensión cURL de PHP debe estar habilitada para verificar pagos.');
    }

    $url = 'https://sandbox.wompi.co/v1/transactions/' . rawurlencode($idTransaccion);
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
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
