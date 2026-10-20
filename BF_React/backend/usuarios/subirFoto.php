<?php
// backend/usuarios/subirFoto.php
// Este archivo recibe una imagen desde el frontend y la guarda en la carpeta uploads.
// Luego devuelve la ruta para poder mostrarla en la app.

// Permite peticiones desde el frontend.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Responde a OPTIONS para validar CORS.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verifica que el archivo haya llegado correctamente.
if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "mensaje" => "No se recibió ninguna imagen válida."]);
    exit();
}

// Carpeta donde se almacenará la imagen.
$directorioSubida = '../uploads/';
if (!file_exists($directorioSubida)) {
    mkdir($directorioSubida, 0777, true);
}

// Genera un nombre único para evitar sobreescribir archivos.
$nombreArchivo = time() . '_' . basename($_FILES['foto']['name']);
$rutaDestino  = $directorioSubida . $nombreArchivo;

// Mueve la imagen temporal al directorio final.
if (move_uploaded_file($_FILES['foto']['tmp_name'], $rutaDestino)) {
    // Devuelve la ruta accesible desde el frontend.
    echo json_encode([
        "status" => "success",
        "mensaje" => "Imagen subida correctamente.",
        "url_foto" => "uploads/" . $nombreArchivo
    ]);
} else {
    // Si falla el guardado, devuelve error.
    echo json_encode(["status" => "error", "mensaje" => "Error al guardar la imagen en el servidor."]);
}