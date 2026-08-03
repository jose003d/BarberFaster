<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["success" => false, "message" => "Método no permitido"]); exit; }

require_once "../config/database.php";
 $datos = json_decode(file_get_contents("php://input"), true);
if (empty($datos['id_usuario']) || !is_numeric($datos['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Debes seleccionar un usuario válido"]);
    exit;
}

if (empty(trim($datos['nombre'] ?? ''))) {
    echo json_encode(["success" => false, "message" => "El nombre es obligatorio"]);
    exit;
}

try {
    $sql = "INSERT INTO Clientes (id_usuario, nombre, fecha_nacimiento) 
            VALUES (:id_usuario, :nombre, :fecha_nacimiento)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id_usuario'       => intval($datos['id_usuario']),
        ':nombre'           => trim($datos['nombre']),
        ':fecha_nacimiento' => !empty($datos['fecha_nacimiento']) ? $datos['fecha_nacimiento'] : null
    ]);

    echo json_encode(["success" => true, "message" => "Cliente creado correctamente"]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["success" => false, "message" => "El usuario seleccionado no existe"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al guardar en la base de datos"]);
    }
}