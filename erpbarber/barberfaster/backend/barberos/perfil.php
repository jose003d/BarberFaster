<?php
// Perfil público del barbero.
// GET ?id_barbero=N: lo consulta cualquiera (para la reserva) si el barbero atiende clientes.
// GET sin id: devuelve el perfil propio de quien inició sesión (barbero o administrador que atiende).
// POST {descripcion}: quien inició sesión edita SU perfil (barbero o administrador que atiende).

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/comun.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $idSolicitado = $_GET['id_barbero'] ?? null;

    try {
        if ($idSolicitado === null || $idSolicitado === '') {
            $sesion = requerirBarberoEnSesion($pdo);
            $perfil = obtenerPerfilBarbero($pdo, (int) $sesion['id_usuario']);
        } else {
            $idBarbero = filter_var($idSolicitado, FILTER_VALIDATE_INT);
            if (!$idBarbero || $idBarbero < 1) {
                responderBarbero(422, ['status' => 'error', 'mensaje' => 'Indica un barbero válido.']);
            }

            // Solo se publica el perfil de quien atiende clientes en una barbería activa.
            $stmt = $pdo->prepare("
                SELECT u.id_usuario
                FROM usuarios u
                INNER JOIN barberias b ON b.id_barberia = u.id_barberia
                WHERE u.id_usuario = ?
                  AND u.estado = 'ACTIVO'
                  AND b.estado = 'ACTIVA'
                  AND (u.rol = 'BARBERO' OR (u.rol = 'ADMINISTRADOR' AND u.atiende_clientes = 1))
                LIMIT 1
            ");
            $stmt->execute([$idBarbero]);
            $perfil = $stmt->fetchColumn() ? obtenerPerfilBarbero($pdo, $idBarbero) : null;
        }

        if (!$perfil) {
            responderBarbero(404, ['status' => 'error', 'mensaje' => 'No se encontró el perfil del barbero.']);
        }
        responderBarbero(200, ['status' => 'success', 'datos' => $perfil]);
    } catch (Throwable $error) {
        error_log('Error al consultar el perfil de un barbero: ' . $error->getMessage());
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudo cargar el perfil del barbero.']);
    }
}

if ($metodo === 'POST') {
    try {
        $sesion = requerirBarberoEnSesion($pdo);
        $datos = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($datos)) {
            responderBarbero(400, ['status' => 'error', 'mensaje' => 'Los datos enviados no son válidos.']);
        }

        $idBarbero = (int) $sesion['id_usuario'];
        $descripcion = trim(preg_replace('/\r\n?/', "\n", (string) ($datos['descripcion'] ?? '')));
        if (mb_strlen($descripcion) > BARBERO_MAX_DESCRIPCION) {
            responderBarbero(422, [
                'status' => 'error',
                'mensaje' => 'La descripción puede tener máximo ' . BARBERO_MAX_DESCRIPCION . ' caracteres.',
            ]);
        }

        $stmt = $pdo->prepare('UPDATE usuarios SET descripcion = ? WHERE id_usuario = ?');
        $stmt->execute([$descripcion === '' ? null : $descripcion, $idBarbero]);

        responderBarbero(200, [
            'status' => 'success',
            'mensaje' => 'Descripción guardada correctamente.',
            'datos' => obtenerPerfilBarbero($pdo, $idBarbero),
        ]);
    } catch (Throwable $error) {
        error_log('Error al guardar el perfil de un barbero: ' . $error->getMessage());
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudo guardar la descripción.']);
    }
}

responderBarbero(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
