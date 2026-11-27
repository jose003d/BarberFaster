<?php

require_once __DIR__ . '/../config/env.php';

function iniciarSesionUsuario(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => rutaBaseApp(),
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function responderErrorAuth(int $codigo, string $mensaje): void
{
    http_response_code($codigo);
    echo json_encode(['status' => 'error', 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit();
}

function longitudCampoAuth(string $valor): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($valor, 'UTF-8');
    }

    $longitud = preg_match_all('/./us', $valor);
    return $longitud === false ? strlen($valor) : $longitud;
}

function esSolicitudLocal(): bool
{
    return in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
}

// Dominios desde los que se permite entrar como SUPERADMIN (SUPERADMIN_HOSTS en
// config.local.php, separados por coma). Ej.: "barbersuperadmin.tech,www.barbersuperadmin.tech".
function hostsSuperadmin(): array
{
    $hosts = array_map(
        static fn(string $host): string => strtolower(trim($host)),
        explode(',', configValor('SUPERADMIN_HOSTS', '') ?? '')
    );
    return array_values(array_filter($hosts, static fn(string $host): bool => $host !== ''));
}

// Con SUPERADMIN_HOSTS definido solo se acepta el SUPERADMIN en esos dominios.
// Sin definirlo (XAMPP), se mantiene el acceso únicamente desde este equipo.
function esAccesoSuperadminPermitido(): bool
{
    $hosts = hostsSuperadmin();
    if ($hosts === []) {
        return esSolicitudLocal();
    }

    $host = strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    return $host !== '' && in_array($host, $hosts, true);
}

function obtenerUsuarioSesion(PDO $pdo): ?array
{
    iniciarSesionUsuario();

    $idUsuario = filter_var(
        $_SESSION['usuario']['id_usuario'] ?? null,
        FILTER_VALIDATE_INT
    );
    if (!$idUsuario || $idUsuario < 1) {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT id_usuario, id_barberia, documento, nombre_completo, telefono, correo, rol, estado, debe_cambiar_contrasena, atiende_clientes
        FROM usuarios
        WHERE id_usuario = :id_usuario
        LIMIT 1
    ");
    $stmt->execute([':id_usuario' => $idUsuario]);
    $usuario = $stmt->fetch();

    if (
        !$usuario
        || $usuario['estado'] !== 'ACTIVO'
        || !in_array($usuario['rol'], ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'], true)
    ) {
        $_SESSION = [];
        session_destroy();
        return null;
    }

    if ($usuario['rol'] === 'SUPERADMIN' && !esAccesoSuperadminPermitido()) {
        return null;
    }

    return [
        'id_usuario' => (int) $usuario['id_usuario'],
        'id_barberia' => $usuario['id_barberia'] === null
            ? null
            : (int) $usuario['id_barberia'],
        'documento' => $usuario['documento'],
        'nombre_completo' => $usuario['nombre_completo'],
        'nombre' => $usuario['nombre_completo'],
        'telefono' => $usuario['telefono'],
        'correo' => $usuario['correo'],
        'email' => $usuario['correo'],
        'rol' => $usuario['rol'],
        'estado' => $usuario['estado'],
        'debe_cambiar_contrasena' => $usuario['rol'] !== 'SUPERADMIN'
            && (bool) $usuario['debe_cambiar_contrasena'],
        // Un administrador que también atiende tiene su propio perfil de barbero.
        'atiende_clientes' => $usuario['rol'] === 'BARBERO'
            || ($usuario['rol'] === 'ADMINISTRADOR' && (bool) $usuario['atiende_clientes']),
    ];
}

function requerirRol(PDO $pdo, array $rolesPermitidos, bool $permitirCambioContrasena = false): array
{
    $usuario = obtenerUsuarioSesion($pdo);
    if (!$usuario) {
        responderErrorAuth(401, 'Debes iniciar sesión para continuar.');
    }

    if (!in_array($usuario['rol'], $rolesPermitidos, true)) {
        responderErrorAuth(403, 'No tienes permiso para realizar esta acción.');
    }

    if ($usuario['debe_cambiar_contrasena'] && !$permitirCambioContrasena) {
        responderErrorAuth(403, 'Debes cambiar tu contraseña antes de continuar.');
    }

    return $usuario;
}
