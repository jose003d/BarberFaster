<?php
// Funciones compartidas del perfil público de cada barbero: permisos, fotos y URLs.

declare(strict_types=1);

const BARBERO_MAX_FOTOS_PORTAFOLIO = 12;
const BARBERO_MAX_BYTES_FOTO = 5 * 1024 * 1024;
const BARBERO_MAX_DESCRIPCION = 500;
const BARBERO_TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

function responderBarbero(int $status, array $respuesta): void
{
    http_response_code($status);
    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
    exit();
}

// URL de barberos/foto.php relativa a donde esté instalado el backend.
function urlFotoBarbero(): string
{
    return rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/foto.php?id_foto=';
}

/**
 * Decide qué barbero puede modificar quien hizo la petición.
 * - Un BARBERO solo puede editarse a sí mismo: el ID enviado se ignora.
 * - Un ADMINISTRADOR puede editarse a sí mismo o a un barbero de su barbería.
 */
function resolverBarberoEditable(PDO $pdo, array $sesion, $idSolicitado): int
{
    if ($sesion['rol'] === 'BARBERO') {
        return (int) $sesion['id_usuario'];
    }

    if ($sesion['rol'] !== 'ADMINISTRADOR') {
        responderBarbero(403, ['status' => 'error', 'mensaje' => 'No tienes permiso para editar este perfil.']);
    }

    $idBarbero = filter_var($idSolicitado, FILTER_VALIDATE_INT);
    if ($idSolicitado === null || $idSolicitado === '' || $idBarbero === (int) $sesion['id_usuario']) {
        return (int) $sesion['id_usuario'];
    }
    if (!$idBarbero || $idBarbero < 1) {
        responderBarbero(422, ['status' => 'error', 'mensaje' => 'Indica un barbero válido.']);
    }

    $stmt = $pdo->prepare("
        SELECT id_usuario
        FROM usuarios
        WHERE id_usuario = ? AND id_barberia = ? AND rol = 'BARBERO'
        LIMIT 1
    ");
    $stmt->execute([$idBarbero, $sesion['id_barberia']]);
    if (!$stmt->fetchColumn()) {
        responderBarbero(404, ['status' => 'error', 'mensaje' => 'No se encontró el barbero en tu barbería.']);
    }

    return $idBarbero;
}

// Valida una imagen subida y devuelve su contenido y tipo MIME real.
function leerImagenSubida(array $archivo): array
{
    if (($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        $status = in_array($archivo['error'] ?? null, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
        responderBarbero($status, ['status' => 'error', 'mensaje' => 'No se pudo recibir una de las fotos seleccionadas.']);
    }
    if (($archivo['size'] ?? 0) > BARBERO_MAX_BYTES_FOTO) {
        responderBarbero(413, ['status' => 'error', 'mensaje' => 'Cada foto debe pesar máximo 5 MB.']);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $tipoMime = $finfo->file($archivo['tmp_name']);
    if (!in_array($tipoMime, BARBERO_TIPOS_FOTO, true) || !getimagesize($archivo['tmp_name'])) {
        responderBarbero(415, ['status' => 'error', 'mensaje' => 'Usa imágenes JPG, PNG o WebP válidas.']);
    }

    $contenido = file_get_contents($archivo['tmp_name']);
    if ($contenido === false) {
        responderBarbero(500, ['status' => 'error', 'mensaje' => 'No se pudo leer una de las fotos seleccionadas.']);
    }

    return ['contenido' => $contenido, 'mime' => $tipoMime];
}

// Arma el perfil público de un barbero: datos, foto de perfil y portafolio.
function obtenerPerfilBarbero(PDO $pdo, int $idBarbero): ?array
{
    $stmt = $pdo->prepare("
        SELECT id_usuario AS id_barbero, id_barberia, nombre_completo AS nombre, descripcion
        FROM usuarios
        WHERE id_usuario = ?
        LIMIT 1
    ");
    $stmt->execute([$idBarbero]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$perfil) {
        return null;
    }

    $stmtFotos = $pdo->prepare("
        SELECT id_foto, tipo, CONCAT(?, id_foto) AS foto
        FROM barbero_fotos
        WHERE id_barbero = ?
        ORDER BY id_foto
    ");
    $stmtFotos->execute([urlFotoBarbero(), $idBarbero]);

    $perfil['id_barbero'] = (int) $perfil['id_barbero'];
    $perfil['id_barberia'] = $perfil['id_barberia'] === null ? null : (int) $perfil['id_barberia'];
    $perfil['descripcion'] = $perfil['descripcion'] ?? '';
    $perfil['foto'] = null;
    $perfil['id_foto_perfil'] = null;
    $perfil['portafolio'] = [];
    foreach ($stmtFotos->fetchAll(PDO::FETCH_ASSOC) as $foto) {
        if ($foto['tipo'] === 'PERFIL') {
            $perfil['foto'] = $foto['foto'];
            $perfil['id_foto_perfil'] = (int) $foto['id_foto'];
        } else {
            $perfil['portafolio'][] = ['id_foto' => (int) $foto['id_foto'], 'foto' => $foto['foto']];
        }
    }

    return $perfil;
}
