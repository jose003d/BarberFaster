<?php

// Reglas compartidas para validar datos de identificación colombianos.

const DOCUMENTO_MIN_DIGITOS = 6;
const DOCUMENTO_MAX_DIGITOS = 10;
const MENSAJE_DOCUMENTO_INVALIDO = 'El número de documento debe tener entre 6 y 10 dígitos, solo números y sin empezar por 0.';

// Cédula de ciudadanía colombiana: entre 6 y 10 dígitos y no empieza por 0.
function documentoColombiaValido(string $documento): bool
{
    return preg_match('/^[1-9]\d{' . (DOCUMENTO_MIN_DIGITOS - 1) . ',' . (DOCUMENTO_MAX_DIGITOS - 1) . '}$/', $documento) === 1;
}

// Los códigos que enviamos por WhatsApp o correo tienen exactamente 6 dígitos.
function codigoVerificacionValido(string $codigo): bool
{
    return preg_match('/^\d{6}$/', $codigo) === 1;
}
