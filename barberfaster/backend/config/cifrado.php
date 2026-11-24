<?php

declare(strict_types=1);

require_once __DIR__ . '/env.php';

// Cifra y descifra secretos guardados en la base de datos (por ejemplo, las
// llaves de Wompi de cada barbería) con AES-256-GCM.
//
// La clave maestra vive en PAGOS_CLAVE_CIFRADO, fuera de la base de datos:
// 32 bytes en base64. Genera una con:
//   php -r "echo base64_encode(random_bytes(32)), PHP_EOL;"
// Si se pierde la clave, las barberías deben volver a pegar sus llaves.
//
// El "contexto" se autentica junto al texto (AAD): un secreto cifrado para la
// barbería 5 no se puede copiar a la fila de otra barbería y descifrarse.

const CIFRADO_VERSION = 'v1';

function cifradoClaveMaestra(): string
{
    $configurada = configValor('PAGOS_CLAVE_CIFRADO');
    if ($configurada === null) {
        throw new RuntimeException('Falta configurar PAGOS_CLAVE_CIFRADO en el servidor.');
    }
    $clave = base64_decode(preg_replace('/^base64:/', '', trim($configurada)), true);
    if ($clave === false || strlen($clave) !== 32) {
        throw new RuntimeException('PAGOS_CLAVE_CIFRADO debe ser una clave de 32 bytes en base64.');
    }

    return $clave;
}

function cifradoDisponible(): bool
{
    try {
        cifradoClaveMaestra();
        return true;
    } catch (Throwable) {
        return false;
    }
}

function cifrarSecreto(string $texto, string $contexto): string
{
    $iv = random_bytes(12);
    $etiqueta = '';
    $cifrado = openssl_encrypt($texto, 'aes-256-gcm', cifradoClaveMaestra(), OPENSSL_RAW_DATA, $iv, $etiqueta, $contexto, 16);
    if ($cifrado === false) {
        throw new RuntimeException('No se pudo cifrar el secreto.');
    }

    return CIFRADO_VERSION . ':' . base64_encode($iv . $etiqueta . $cifrado);
}

function descifrarSecreto(string $valor, string $contexto): string
{
    [$version, $datos] = array_pad(explode(':', $valor, 2), 2, '');
    $binario = base64_decode($datos, true);
    if ($version !== CIFRADO_VERSION || $binario === false || strlen($binario) < 29) {
        throw new RuntimeException('El secreto guardado no tiene un formato válido.');
    }

    $texto = openssl_decrypt(
        substr($binario, 28),
        'aes-256-gcm',
        cifradoClaveMaestra(),
        OPENSSL_RAW_DATA,
        substr($binario, 0, 12),
        substr($binario, 12, 16),
        $contexto
    );
    if ($texto === false) {
        throw new RuntimeException('No se pudo descifrar el secreto (¿cambió PAGOS_CLAVE_CIFRADO?).');
    }

    return $texto;
}
