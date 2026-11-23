<?php
// backend/clientes/crearc.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once __DIR__ . '/../config/validaciones.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "La solicitud no contiene datos válidos."]);
    exit();
}

$dni      = isset($data['dni']) && is_scalar($data['dni']) ? trim((string)$data['dni']) : '';
$nombre   = isset($data['nombre']) && is_scalar($data['nombre']) ? trim((string)$data['nombre']) : '';
$telefono = isset($data['telefono']) && is_scalar($data['telefono']) ? trim((string)$data['telefono']) : '';
$correo   = isset($data['correo']) && is_scalar($data['correo']) ? trim((string)$data['correo']) : '';

if (
    !documentoColombiaValido($dni)
    || $nombre === ''
    || $telefono === ''
    || strlen($telefono) > 20
    || strlen($nombre) > 100
    || strlen($correo) > 120
    || ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL))
) {
    http_response_code(422);
    echo json_encode(["status" => "error", "mensaje" => "Revisa el documento (entre 6 y 10 dígitos, sin empezar por 0), el nombre, el teléfono (máximo 20 caracteres) y el correo ingresados."]);
    exit();
}

try {
    // Registra o actualiza los datos si el DNI ya existía
    $stmt = $pdo->prepare("
        INSERT INTO clientes (dni, nombre, telefono, email)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            nombre = VALUES(nombre),
            telefono = VALUES(telefono),
            email = VALUES(email)
    ");
    $stmt->execute([$dni, $nombre, $telefono, $correo !== '' ? $correo : null]);

    echo json_encode([
        "status" => "success",
        "mensaje" => "Cliente guardado correctamente.",
        "dni" => $dni
    ]);
} catch (Exception $e) {
    error_log('Error al guardar cliente: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo guardar el cliente."]);
}