<?php
// Este archivo actualiza los datos de un usuario existente.
// Se usa para cambiar nombre, apellido, email, teléfono, documento y rol.

// Permite que el frontend pueda enviar la petición desde otro origen.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Responde a la petición OPTIONS antes del POST real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Define la respuesta como JSON.
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // Lee el JSON enviado desde el frontend.
    $data = json_decode(file_get_contents("php://input"), true);

    // Validación: el ID y el nombre son obligatorios.
    if (empty($data['id_usuario'])) {
        echo json_encode(["success" => false, "error" => "ID requerido"]);
        exit;
    }
    if (empty($data['nombre'])) {
        echo json_encode(["success" => false, "error" => "El nombre es obligatorio"]);
        exit;
    }

    // Actualiza los datos del usuario en la tabla usuarios.
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

    // Responde con éxito.
    echo json_encode(["success" => true, "message" => "Usuario actualizado"]);

} catch (Exception $e) {
    // Si sucede un error, lo devuelve en JSON.
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}