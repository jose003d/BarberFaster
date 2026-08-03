<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(["success" => false, "message" => "Método no permitido"]); exit; }

require_once "../config/database.php";
 $datos = json_decode(file_get_contents("php://input"), true);

// Validaciones obligatorias
 $camposObligatorios = ['nombre', 'email', 'password_hash', 'rol', 'documento'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($datos[$campo] ?? ''))) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    $sql = "INSERT INTO usuarios (nombre, email, password_hash, telefono, rol, documento) 
            VALUES (:nombre, :email, :password_hash, :telefono, :rol, :documento)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nombre'         => trim($datos['nombre']),
        ':email'          => trim($datos['email']),
        ':password_hash'  => $datos['password_hash'],
        ':telefono'       => trim($datos['telefono'] ?? null),
        ':rol'            => trim($datos['rol']),
        ':documento'      => trim($datos['documento'])
    ]);

    echo json_encode(["success" => true, "message" => "Usuario creado", "id" => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["success" => false, "message" => "El email ya está registrado"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al guardar usuario"]);
    }
}