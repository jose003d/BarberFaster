<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id_usuario'])) {
        echo json_encode(["success" => false, "error" => "ID requerido"]);
        exit;
    }
    if (empty($data['nombre'])) {
        echo json_encode(["success" => false, "error" => "El nombre es obligatorio"]);
        exit;
    }

    $sql = "UPDATE usuarios SET
                nombre    = :nombre,
                apellido  = :apellido,
                email     = :email,
                telefono  = :telefono,
                documento = :documento,
                rol       = :rol
            WHERE id_usuario = :id_usuario";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_usuario' => $data['id_usuario'],
        ':nombre'     => $data['nombre'],
        ':apellido'   => $data['apellido']  ?? '',
        ':email'      => $data['email']     ?? '',
        ':telefono'   => $data['telefono']  ?? '',
        ':documento'  => $data['documento'] ?? '',
        ':rol'        => $data['rol']       ?? 'barbero',
    ]);

    echo json_encode(["success" => true, "message" => "Usuario actualizado"]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}