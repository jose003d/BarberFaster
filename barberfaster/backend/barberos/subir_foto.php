<?php

// Recibe una foto de barbero, valida el archivo y actualiza su ruta en la base.

// Define la respuesta JSON y limita este endpoint a la carga de imágenes por POST.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

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
// Verifica el tipo real del archivo y confirma que el barbero exista.
$finfo = new finfo(FILEINFO_MIME_TYPE);
$tipoMime = $finfo->file($archivo['tmp_name']);
if (!isset($tiposPermitidos[$tipoMime])) {
    http_response_code(415);
    echo json_encode(["status" => "error", "mensaje" => "Usa una imagen JPG, PNG o WebP."]);
    exit();
}

$consulta = $pdo->prepare("SELECT foto FROM barberos WHERE id_barbero = ?");
$consulta->execute([$idBarbero]);
$barbero = $consulta->fetch(PDO::FETCH_ASSOC);
if (!$barbero) {
    http_response_code(404);
    echo json_encode(["status" => "error", "mensaje" => "No se encontró el barbero seleccionado."]);
    exit();
}

$directorio = __DIR__ . '/../uploads/barberos';
// Genera un nombre aleatorio, guarda el archivo y registra su ruta relativa.
if (!is_dir($directorio) && !mkdir($directorio, 0755, true) && !is_dir($directorio)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo preparar el almacenamiento de fotos."]);
    exit();
}

$nombreArchivo = bin2hex(random_bytes(16)) . '.' . $tiposPermitidos[$tipoMime];
$rutaArchivo = $directorio . DIRECTORY_SEPARATOR . $nombreArchivo;
$rutaGuardada = 'barberos/' . $nombreArchivo;

if (!move_uploaded_file($archivo['tmp_name'], $rutaArchivo)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo guardar la foto."]);
    exit();
}

try {
    // Actualiza la foto y elimina la anterior solo si es un archivo gestionado.
    $actualizar = $pdo->prepare("UPDATE barberos SET foto = ? WHERE id_barbero = ?");
    $actualizar->execute([$rutaGuardada, $idBarbero]);

    $fotoAnterior = $barbero['foto'] ?? '';
    if (preg_match('/^barberos\/[a-f0-9]{32}\.(jpg|png|webp)$/', $fotoAnterior)) {
        $rutaAnterior = $directorio . DIRECTORY_SEPARATOR . basename($fotoAnterior);
        if (is_file($rutaAnterior) && !unlink($rutaAnterior)) {
            error_log('No se pudo eliminar la foto anterior del barbero ' . $idBarbero . '.');
        }
    }

    echo json_encode([
        "status" => "success",
        "mensaje" => "Foto actualizada correctamente.",
        "foto" => $rutaGuardada,
    ]);
} catch (Throwable $error) {
    // Limpia el archivo nuevo si la actualización de base de datos falla.
    if (is_file($rutaArchivo)) {
        unlink($rutaArchivo);
    }
    error_log('Error al guardar la foto del barbero: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo guardar la foto del barbero."]);
}
