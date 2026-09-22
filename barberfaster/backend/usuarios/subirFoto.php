<?php
// backend/usuarios/subirFoto.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "mensaje" => "No se recibió ninguna imagen válida."]);
    exit();
}

$directorioSubida = '../uploads/';
if (!file_exists($directorioSubida)) {
    mkdir($directorioSubida, 0777, true);
}

$nombreArchivo = time() . '_' . basename($_FILES['foto']['name']);
$rutaDestino  = $directorioSubida . $nombreArchivo;

if (move_uploaded_file($_FILES['foto']['tmp_name'], $rutaDestino)) {
    echo json_encode([
        "status" => "success",
        "mensaje" => "Imagen subida correctamente.",
        "url_foto" => "uploads/" . $nombreArchivo
    ]);
} else {
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar la imagen en el servidor."]);
}