<?php

// Recibe una foto de barbero, valida su contenido y guarda sus bytes en MySQL.

// Define la respuesta JSON y limita este endpoint a la carga de imágenes por POST.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

// Atiende preflight CORS y rechaza métodos distintos de POST.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "mensaje" => "Método no permitido."]);
    exit();
}

require_once '../config/database.php';

// Valida identificador, presencia del archivo, carga y límite de tamaño.
$idBarbero = filter_input(INPUT_POST, 'id_barbero', FILTER_VALIDATE_INT);
if (!$idBarbero || $idBarbero < 1) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Selecciona un barbero válido."]);
    exit();
}

if (!isset($_FILES['foto'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "Selecciona una foto para subir."]);
    exit();
}

$archivo = $_FILES['foto'];
if ($archivo['error'] !== UPLOAD_ERR_OK) {
    $status = in_array($archivo['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
    http_response_code($status);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo recibir la foto seleccionada."]);
    exit();
}

$maximoBytes = 5 * 1024 * 1024;
if ($archivo['size'] > $maximoBytes) {
    http_response_code(413);
    echo json_encode(["status" => "error", "mensaje" => "La foto no puede superar los 5 MB."]);
    exit();
}

$tiposPermitidos = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
// Detecta el formato real y confirma que el archivo sea una imagen decodificable.
$finfo = new finfo(FILEINFO_MIME_TYPE);
$tipoMime = $finfo->file($archivo['tmp_name']);
if (!isset($tiposPermitidos[$tipoMime]) || !getimagesize($archivo['tmp_name'])) {
    http_response_code(415);
    echo json_encode(["status" => "error", "mensaje" => "Usa una imagen JPG, PNG o WebP."]);
    exit();
}

$consulta = $pdo->prepare("SELECT id_barbero FROM barberos WHERE id_barbero = ?");
$consulta->execute([$idBarbero]);
if (!$consulta->fetchColumn()) {
    http_response_code(404);
    echo json_encode(["status" => "error", "mensaje" => "No se encontró el barbero seleccionado."]);
    exit();
}

// Lee los bytes antes de guardar y reporta si el archivo temporal no está disponible.
$contenidoFoto = file_get_contents($archivo['tmp_name']);
if ($contenidoFoto === false) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo leer la foto subida."]);
    exit();
}

try {
    // Guarda el archivo binario y su MIME; la columna foto conserva rutas antiguas.
    $actualizar = $pdo->prepare("
        UPDATE barberos
        SET foto_datos = :foto_datos, foto_mime = :foto_mime
        WHERE id_barbero = :id_barbero
    ");
    $actualizar->bindValue(':foto_datos', $contenidoFoto, PDO::PARAM_LOB);
    $actualizar->bindValue(':foto_mime', $tipoMime, PDO::PARAM_STR);
    $actualizar->bindValue(':id_barbero', $idBarbero, PDO::PARAM_INT);
    $actualizar->execute();

    $urlFoto = '/erpbarber/barberfaster/backend/barberos/foto.php?id_barbero='
        . $idBarbero . '&v=' . time();

    echo json_encode([
        "status" => "success",
        "mensaje" => "Foto actualizada correctamente.",
        "foto" => $urlFoto,
    ]);
} catch (Throwable $error) {
    error_log('Error al guardar la foto del barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo guardar la foto del barbero."]);
}
