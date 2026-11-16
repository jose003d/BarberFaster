<?php
// backend/clientes/editarc.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

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

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "mensaje" => "La solicitud no contiene datos válidos."]);
    exit();
}

$dni = isset($data['dni']) && is_scalar($data['dni']) ? trim((string)$data['dni']) : '';
$nombre = isset($data['nombre']) && is_scalar($data['nombre']) ? trim((string)$data['nombre']) : '';
$telefono = isset($data['telefono']) && is_scalar($data['telefono']) ? trim((string)$data['telefono']) : '';
$correo = isset($data['correo']) && is_scalar($data['correo']) ? trim((string)$data['correo']) : '';

if (
    !preg_match('/^\d{1,10}$/', $dni)
    || $nombre === ''
    || strlen($nombre) > 100
    || $telefono === ''
    || strlen($telefono) > 20
    || strlen($correo) > 120
    || ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL))
) {
    http_response_code(422);
    echo json_encode(["status" => "error", "mensaje" => "Revisa el DNI (máximo 10 dígitos), el nombre, el teléfono (máximo 20 caracteres) y el correo ingresados."]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE clientes
        SET nombre = ?, telefono = ?, email = ?
        WHERE dni = ?
    ");
    $stmt->execute([$nombre, $telefono, $correo !== '' ? $correo : null, $dni]);

    if ($stmt->rowCount() === 0) {
        $exists = $pdo->prepare("SELECT 1 FROM clientes WHERE dni = ?");
        $exists->execute([$dni]);
        if (!$exists->fetchColumn()) {
            http_response_code(404);
            echo json_encode(["status" => "error", "mensaje" => "No se encontró el cliente que deseas editar."]);
            exit();
        }
    }

    echo json_encode([
        "status" => "success",
        "mensaje" => "Cliente actualizado correctamente.",
        "dni" => $dni
    ]);
} catch (Exception $e) {
    error_log('Error al actualizar cliente: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudo actualizar el cliente."]);
}
