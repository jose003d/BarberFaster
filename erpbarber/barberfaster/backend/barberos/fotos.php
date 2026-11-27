<?php
// Fotos del barbero: una de perfil y hasta 12 de portafolio.
// POST multipart {tipo: PERFIL|PORTAFOLIO, fotos[]}: sube fotos.
//   Con tipo PERFIL la foto nueva reemplaza a la anterior.
// DELETE {id_foto}: elimina una foto.
// Siempre se tocan las fotos de quien inició sesión: nadie edita el perfil de otro.

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

if ($metodo === 'POST') {
    try {
        $sesion = requerirBarberoEnSesion($pdo);
        $idBarbero = (int) $sesion['id_usuario'];
    } catch (Throwable $error) {
        error_log('Error al validar acceso a las fotos del barbero: ' . $error->getMessage());
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudo validar el acceso.']);
    }

    $tipo = strtoupper((string) ($_POST['tipo'] ?? ''));
    if (!in_array($tipo, ['PERFIL', 'PORTAFOLIO'], true)) {
        responderBarbero(422, ['status' => 'error', 'mensaje' => 'Indica si la foto es de perfil o de portafolio.']);
    }

    // Acepta "fotos[]" (varias) o "foto" (una sola).
    $archivos = [];
    if (isset($_FILES['fotos']) && is_array($_FILES['fotos']['name'])) {
        foreach ($_FILES['fotos']['name'] as $indice => $nombre) {
            if ($nombre === '') {
                continue;
            }
            $archivos[] = [
                'tmp_name' => $_FILES['fotos']['tmp_name'][$indice] ?? '',
                'error' => $_FILES['fotos']['error'][$indice] ?? UPLOAD_ERR_NO_FILE,
                'size' => $_FILES['fotos']['size'][$indice] ?? 0,
            ];
        }
    } elseif (isset($_FILES['foto']) && ($_FILES['foto']['name'] ?? '') !== '') {
        $archivos[] = $_FILES['foto'];
    }

    if ($archivos === []) {
        responderBarbero(400, ['status' => 'error', 'mensaje' => 'Selecciona al menos una foto.']);
    }
    if ($tipo === 'PERFIL' && count($archivos) > 1) {
        responderBarbero(422, ['status' => 'error', 'mensaje' => 'La foto de perfil es una sola imagen.']);
    }

    $fotosValidadas = array_map('leerImagenSubida', $archivos);

    try {
        $pdo->beginTransaction();
        // Bloquea al barbero para que dos subidas a la vez no superen el límite.
        $stmtBloqueo = $pdo->prepare('SELECT id_usuario FROM usuarios WHERE id_usuario = ? FOR UPDATE');
        $stmtBloqueo->execute([$idBarbero]);

        if ($tipo === 'PERFIL') {
            $pdo->prepare("DELETE FROM barbero_fotos WHERE id_barbero = ? AND tipo = 'PERFIL'")
                ->execute([$idBarbero]);
        } else {
            $stmtConteo = $pdo->prepare("SELECT COUNT(*) FROM barbero_fotos WHERE id_barbero = ? AND tipo = 'PORTAFOLIO'");
            $stmtConteo->execute([$idBarbero]);
            $totalActual = (int) $stmtConteo->fetchColumn();
            if ($totalActual + count($fotosValidadas) > BARBERO_MAX_FOTOS_PORTAFOLIO) {
                $pdo->rollBack();
                responderBarbero(400, [
                    'status' => 'error',
                    'mensaje' => 'El portafolio admite máximo ' . BARBERO_MAX_FOTOS_PORTAFOLIO
                        . ' fotos. Puedes agregar ' . max(0, BARBERO_MAX_FOTOS_PORTAFOLIO - $totalActual) . ' más.',
                ]);
            }
        }

        $stmtInsertar = $pdo->prepare("
            INSERT INTO barbero_fotos (id_barbero, tipo, foto_datos, foto_mime)
            VALUES (?, ?, ?, ?)
        ");
        foreach ($fotosValidadas as $foto) {
            $stmtInsertar->bindValue(1, $idBarbero, PDO::PARAM_INT);
            $stmtInsertar->bindValue(2, $tipo, PDO::PARAM_STR);
            $stmtInsertar->bindValue(3, $foto['contenido'], PDO::PARAM_LOB);
            $stmtInsertar->bindValue(4, $foto['mime'], PDO::PARAM_STR);
            $stmtInsertar->execute();
        }
        $pdo->commit();

        responderBarbero(201, [
            'status' => 'success',
            'mensaje' => $tipo === 'PERFIL' ? 'Foto de perfil actualizada.' : 'Fotos agregadas al portafolio.',
            'datos' => obtenerPerfilBarbero($pdo, $idBarbero),
        ]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Error al guardar fotos del barbero: ' . $error->getMessage());
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudieron guardar las fotos.']);
    }
}

if ($metodo === 'DELETE') {
    $datos = json_decode((string) file_get_contents('php://input'), true);
    $idFoto = filter_var($datos['id_foto'] ?? null, FILTER_VALIDATE_INT);
    if (!$idFoto || $idFoto < 1) {
        responderBarbero(400, ['status' => 'error', 'mensaje' => 'Indica una foto válida.']);
    }

    try {
        $sesion = requerirBarberoEnSesion($pdo);
        $idBarbero = (int) $sesion['id_usuario'];

        // La condición por id_barbero impide borrar fotos de otro barbero.
        $stmt = $pdo->prepare('DELETE FROM barbero_fotos WHERE id_foto = ? AND id_barbero = ?');
        $stmt->execute([$idFoto, $idBarbero]);
        if ($stmt->rowCount() === 0) {
            responderBarbero(404, ['status' => 'error', 'mensaje' => 'No se encontró la foto para eliminar.']);
        }

        responderBarbero(200, [
            'status' => 'success',
            'mensaje' => 'Foto eliminada correctamente.',
            'datos' => obtenerPerfilBarbero($pdo, $idBarbero),
        ]);
    } catch (Throwable $error) {
        error_log('Error al eliminar una foto del barbero: ' . $error->getMessage());
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudo eliminar la foto.']);
    }
}

responderBarbero(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
