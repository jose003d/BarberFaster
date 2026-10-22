<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

function responderFotos(int $status, array $respuesta): void
{
    http_response_code($status);
    echo json_encode($respuesta);
    exit();
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $idBarberia = filter_input(INPUT_GET, 'id_barberia', FILTER_VALIDATE_INT);
    if ($idBarberia !== null && (!$idBarberia || $idBarberia < 1)) {
        responderFotos(400, ['status' => 'error', 'mensaje' => 'Indica una barbería válida.']);
    }

    try {
        $sql = "
            SELECT
                bf.id_foto,
                bf.id_barberia,
                CONCAT(
                    '/erpbarber/barberfaster/backend/barberias/foto.php?id_foto=',
                    bf.id_foto
                ) AS foto
            FROM barberia_fotos bf
            INNER JOIN barberias b ON b.id_barberia = bf.id_barberia
            WHERE 1 = 1
        ";
        $parametros = [];
        if ($idBarberia !== null) {
            $sql .= ' AND bf.id_barberia = ?';
            $parametros[] = $idBarberia;
        } else {
            $sql .= " AND b.estado = 'ACTIVA'";
        }
        $sql .= ' ORDER BY bf.id_foto';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($parametros);
        responderFotos(200, ['status' => 'success', 'datos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Throwable $error) {
        error_log('Error al listar fotos de barberías: ' . $error->getMessage());
        responderFotos(500, ['status' => 'error', 'mensaje' => 'No se pudieron cargar las fotos de la barbería.']);
    }
}

if ($metodo === 'POST') {
    $idBarberia = filter_input(INPUT_POST, 'id_barberia', FILTER_VALIDATE_INT);
    if (!$idBarberia || $idBarberia < 1) {
        responderFotos(400, ['status' => 'error', 'mensaje' => 'Selecciona una barbería válida.']);
    }
    if (!isset($_FILES['fotos']) || !is_array($_FILES['fotos']['name'])) {
        responderFotos(400, ['status' => 'error', 'mensaje' => 'Selecciona al menos una foto.']);
    }

    $archivos = [];
    foreach ($_FILES['fotos']['name'] as $indice => $nombre) {
        if ($nombre === '') {
            continue;
        }
        $archivos[] = [
            'name' => $nombre,
            'type' => $_FILES['fotos']['type'][$indice] ?? '',
            'tmp_name' => $_FILES['fotos']['tmp_name'][$indice] ?? '',
            'error' => $_FILES['fotos']['error'][$indice] ?? UPLOAD_ERR_NO_FILE,
            'size' => $_FILES['fotos']['size'][$indice] ?? 0,
        ];
    }
    if ($archivos === []) {
        responderFotos(400, ['status' => 'error', 'mensaje' => 'Selecciona al menos una foto.']);
    }

    $fotosValidadas = [];
    $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    $maximoBytes = 5 * 1024 * 1024;
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    foreach ($archivos as $archivo) {
        if ($archivo['error'] !== UPLOAD_ERR_OK) {
            $status = in_array($archivo['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
            responderFotos($status, ['status' => 'error', 'mensaje' => 'No se pudo recibir una de las fotos seleccionadas.']);
        }
        if ($archivo['size'] > $maximoBytes) {
            responderFotos(413, ['status' => 'error', 'mensaje' => 'Cada foto debe pesar máximo 5 MB.']);
        }

        $tipoMime = $finfo->file($archivo['tmp_name']);
        if (!in_array($tipoMime, $tiposPermitidos, true) || !getimagesize($archivo['tmp_name'])) {
            responderFotos(415, ['status' => 'error', 'mensaje' => 'Usa imágenes JPG, PNG o WebP válidas.']);
        }
        $contenido = file_get_contents($archivo['tmp_name']);
        if ($contenido === false) {
            responderFotos(500, ['status' => 'error', 'mensaje' => 'No se pudo leer una de las fotos seleccionadas.']);
        }
        $fotosValidadas[] = ['contenido' => $contenido, 'mime' => $tipoMime];
    }

    try {
        $stmtBarberia = $pdo->prepare("SELECT id_barberia FROM barberias WHERE id_barberia = ?");
        $stmtBarberia->execute([$idBarberia]);
        if (!$stmtBarberia->fetchColumn()) {
            responderFotos(404, ['status' => 'error', 'mensaje' => 'No se encontró la barbería seleccionada.']);
        }

        $pdo->beginTransaction();
        $stmtBloqueo = $pdo->prepare("SELECT id_barberia FROM barberias WHERE id_barberia = ? FOR UPDATE");
        $stmtBloqueo->execute([$idBarberia]);
        $stmtConteo = $pdo->prepare("SELECT COUNT(*) FROM barberia_fotos WHERE id_barberia = ?");
        $stmtConteo->execute([$idBarberia]);
        $totalActual = (int)$stmtConteo->fetchColumn();

        if ($totalActual + count($fotosValidadas) > 8) {
            $pdo->rollBack();
            responderFotos(400, [
                'status' => 'error',
                'mensaje' => 'Cada barbería puede tener máximo 8 fotos. Puedes agregar ' . max(0, 8 - $totalActual) . ' más.',
            ]);
        }

        $stmtInsertar = $pdo->prepare("
            INSERT INTO barberia_fotos (id_barberia, foto_datos, foto_mime)
            VALUES (?, ?, ?)
        ");
        foreach ($fotosValidadas as $foto) {
            $stmtInsertar->bindValue(1, $idBarberia, PDO::PARAM_INT);
            $stmtInsertar->bindValue(2, $foto['contenido'], PDO::PARAM_LOB);
            $stmtInsertar->bindValue(3, $foto['mime'], PDO::PARAM_STR);
            $stmtInsertar->execute();
        }
        $pdo->commit();
        responderFotos(201, ['status' => 'success', 'mensaje' => 'Fotos agregadas correctamente.']);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Error al guardar fotos de barbería: ' . $error->getMessage());
        responderFotos(500, ['status' => 'error', 'mensaje' => 'No se pudieron guardar las fotos de la barbería.']);
    }
}

if ($metodo === 'DELETE') {
    $datos = json_decode(file_get_contents('php://input'), true);
    $idFoto = filter_var($datos['id_foto'] ?? null, FILTER_VALIDATE_INT);
    $idBarberia = filter_var($datos['id_barberia'] ?? null, FILTER_VALIDATE_INT);
    if (!$idFoto || $idFoto < 1 || !$idBarberia || $idBarberia < 1) {
        responderFotos(400, ['status' => 'error', 'mensaje' => 'Indica una foto y una barbería válidas.']);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM barberia_fotos WHERE id_foto = ? AND id_barberia = ?');
        $stmt->execute([$idFoto, $idBarberia]);
        if ($stmt->rowCount() === 0) {
            responderFotos(404, ['status' => 'error', 'mensaje' => 'No se encontró la foto para eliminar.']);
        }
        responderFotos(200, ['status' => 'success', 'mensaje' => 'Foto eliminada correctamente.']);
    } catch (Throwable $error) {
        error_log('Error al eliminar foto de barbería: ' . $error->getMessage());
        responderFotos(500, ['status' => 'error', 'mensaje' => 'No se pudo eliminar la foto.']);
    }
}

responderFotos(405, ['status' => 'error', 'mensaje' => 'Método no permitido.']);
