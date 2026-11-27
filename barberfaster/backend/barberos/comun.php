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

/**
 * Barberos que atienden clientes en una barbería, con foto de perfil, descripción y
 * calificación. Única fuente para la reserva (listar_barberos.php) y para el detalle
 * público de la barbería (detalle_publico.php), para que ambos muestren lo mismo.
 */
function listarBarberosPublicos(PDO $pdo, int $idBarberia, string $urlFoto): array
{
    $stmt = $pdo->prepare("
        SELECT
            u.id_usuario AS id_barbero,
            u.id_barberia,
            u.nombre_completo AS nombre,
            u.rol = 'ADMINISTRADOR' AS es_administrador,
            '' AS apellido,
            NULL AS especialidad,
            u.descripcion,
            (
                SELECT CONCAT(?, bf.id_foto)
                FROM barbero_fotos bf
                WHERE bf.id_barbero = u.id_usuario AND bf.tipo = 'PERFIL'
                ORDER BY bf.id_foto DESC
                LIMIT 1
            ) AS foto,
            COALESCE(AVG(r.calificacion), 0) AS calificacion_promedio,
            COUNT(r.id_resena) AS cantidad_calificaciones
        FROM usuarios u
        LEFT JOIN citas c ON c.id_barbero = u.id_usuario
        LEFT JOIN resenas r ON r.id_cita = c.id_cita
        WHERE u.id_barberia = ?
          AND (u.rol = 'BARBERO' OR (u.rol = 'ADMINISTRADOR' AND u.atiende_clientes = 1))
          AND u.estado = 'ACTIVO'
        GROUP BY u.id_usuario, u.id_barberia, u.nombre_completo, u.rol, u.descripcion
        ORDER BY u.nombre_completo ASC
    ");
    $stmt->execute([$urlFoto, $idBarberia]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
