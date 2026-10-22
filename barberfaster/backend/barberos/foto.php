<?php
// Sirve la imagen binaria del barbero guardada en MySQL.
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit();
}

$idBarbero = filter_input(INPUT_GET, 'id_barbero', FILTER_VALIDATE_INT);
if (!$idBarbero || $idBarbero < 1) {
    http_response_code(400);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    // Consulta solo los bytes y el MIME almacenados para el barbero solicitado.
    $stmt = $pdo->prepare("
        SELECT foto_datos, foto_mime
        FROM barberos
        WHERE id_barbero = ?
    ");
    $stmt->execute([$idBarbero]);
    $foto = $stmt->fetch(PDO::FETCH_ASSOC);

    $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!$foto || !$foto['foto_datos'] || !in_array($foto['foto_mime'], $tiposPermitidos, true)) {
        http_response_code(404);
        exit();
    }

    $contenido = is_resource($foto['foto_datos'])
        ? stream_get_contents($foto['foto_datos'])
        : $foto['foto_datos'];
    if (!is_string($contenido) || $contenido === '') {
        http_response_code(404);
        exit();
    }

    // Devuelve el archivo con su MIME real para mostrarlo como imagen en el navegador.
    header('Content-Type: ' . $foto['foto_mime']);
    header('Content-Length: ' . strlen($contenido));
    echo $contenido;
} catch (Throwable $error) {
    error_log('Error al obtener foto de barbero: ' . $error->getMessage());
    http_response_code(500);
}
