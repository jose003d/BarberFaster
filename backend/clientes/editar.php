<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";
 $data = json_decode(file_get_contents("php://input"), true);

// Validaciones
if (empty($data['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "ID de usuario requerido"]);
    exit;
}

if (empty(trim($data['nombre'] ?? ''))) {
    echo json_encode(["success" => false, "message" => "El nombre es obligatorio"]);
    exit;
}

try {
    $sql = "UPDATE Clientes SET 
                nombre = :nombre, 
                fecha_nacimiento = :fecha_nacimiento
            WHERE id_usuario = :id_usuario";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":id_usuario"       => $data['id_usuario'],
        ":nombre"           => trim($data['nombre']),
        ":fecha_nacimiento" => !empty($data['fecha_nacimiento']) ? $data['fecha_nacimiento'] : null
    ]);

    echo json_encode(["success" => true, "message" => "Cliente actualizado correctamente"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Error al actualizar en la base de datos"]);
}