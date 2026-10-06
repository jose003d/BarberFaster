<?php

function horaAMinutos($hora)
{
    if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/', (string)$hora, $partes)) {
        return null;
    }

    if (isset($partes[3]) && (int)$partes[3] !== 0) {
        return null;
    }

    return ((int)$partes[1] * 60) + (int)$partes[2];
}

function minutosAHora($minutos)
{
    if (!is_int($minutos) || $minutos < 0 || $minutos >= 24 * 60) {
        return null;
    }

    return sprintf('%02d:%02d:00', intdiv($minutos, 60), $minutos % 60);
}
