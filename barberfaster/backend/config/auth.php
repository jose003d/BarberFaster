<?php
require_once __DIR__ . '/../Auth/common.php';

// Exige la sesión de alguien que atiende clientes: un BARBERO o un ADMINISTRADOR
// que marcó "Yo también atiendo clientes". Devuelve su usuario; el perfil y la
// agenda que se tocan siempre son los de esta sesión.
function requerirBarberoEnSesion(PDO $pdo): array
{
    $usuario = requerirRol($pdo, ['BARBERO', 'ADMINISTRADOR']);
    if (!$usuario['atiende_clientes']) {
        responderErrorAuth(403, 'Activa "Yo también atiendo clientes" en Personal para tener tu perfil de barbero.');
    }

    return $usuario;
}
