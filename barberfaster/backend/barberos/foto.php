<?php
// Entrega una foto de barbero (perfil o portafolio) guardada en la base de datos.

declare(strict_types=1);

header('Cache-Control: public, max-age=3600');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit();
}

$idFoto = filter_input(INPUT_GET, 'id_foto', FILTER_VALIDATE_INT);
if (!$idFoto || $idFoto < 1) {
    http_response_code(400);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->prepare('SELECT foto_datos, foto_mime FROM barbero_fotos WHERE id_foto = ?');
    $stmt->execute([$idFoto]);
    $foto = $stmt->fetch(PDO::FETCH_ASSOC);
    $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!$foto || !in_array($foto['foto_mime'], $tiposPermitidos, true)) {
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

    header('Content-Type: ' . $foto['foto_mime']);
    header('Content-Length: ' . strlen($contenido));
    echo $contenido;
} catch (Throwable $error) {
    error_log('Error al obtener foto de barbero: ' . $error->getMessage());
    http_response_code(500);
}
