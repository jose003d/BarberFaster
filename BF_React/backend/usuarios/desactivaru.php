<?php
// Este archivo alterna el estado de un usuario entre activo e inactivo.
// Se usa para desactivar o reactivar un usuario sin eliminarlo físicamente.

// Permite que el frontend haga la petición desde otro origen.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Responde a una solicitud OPTIONS antes del POST real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Define el tipo de respuesta como JSON.
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // Lee el JSON enviado desde el frontend.
    $data = json_decode(file_get_contents("php://input"), true);

    // Valida que venga el ID del usuario.
    if (empty($data['id_usuario'])) {
        echo json_encode(["success" => false, "error" => "ID requerido"]);
        exit;
    }

    // Invierte el estado del usuario: 1 -> 0 y 0 -> 1.
    $sql = "UPDATE Usuarios SET estado = IF(estado = 1, 0, 1) WHERE id_usuario = :id_usuario";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([":id_usuario" => $data['id_usuario']]);

    // Respuesta exitosa.
    echo json_encode(["success" => true, "message" => "Estado actualizado"]);
} catch (Exception $e) {
    // Si falla, devuelve el error.
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
