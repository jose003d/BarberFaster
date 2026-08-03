<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config/database.php";
 $data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "ID de usuario requerido"]);
    exit;
}

 $camposObligatorios = ['nombre', 'email', 'rol', 'documento'];
foreach ($camposObligatorios as $campo) {
    if (empty(trim($data[$campo] ?? ''))) {
        echo json_encode(["success" => false, "message" => "El campo $campo es obligatorio"]);
        exit;
    }
}

try {
    // Si hay contra se realiza el "else"
    if (!empty($data['password_hash'])) {
        $sql = "UPDATE usuarios SET 
                    nombre = :nombre, 
                    email = :email, 
                    password_hash = :password_hash, 
                    telefono = :telefono, 
                    rol = :rol, 
                    estado = :estado, 
                    documento = :documento
                WHERE id_usuario = :id_usuario";
    } else {
        $sql = "UPDATE usuarios SET 
                    nombre = :nombre, 
                    email = :email, 
                    telefono = :telefono, 
                    rol = :rol, 
                    estado = :estado, 
                    documento = :documento
                WHERE id_usuario = :id_usuario";
    }

    $stmt = $pdo->prepare($sql);
    
    $params = [
        ":id_usuario"  => $data['id_usuario'],
        ":nombre"      => trim($data['nombre']),
        ":email"       => trim($data['email']),
        ":telefono"    => trim($data['telefono'] ?? null),
        ":rol"         => trim($data['rol']),
        ":estado"      => isset($data['estado']) ? intval($data['estado']) : 1,
        ":documento"   => trim($data['documento'])
    ];

    // Si hay contraseña también se edita
    if (!empty($data['password_hash'])) {
        $params[":password_hash"] = $data['password_hash'];
    }

    $stmt->execute($params);

    echo json_encode(["success" => true, "message" => "Usuario actualizado correctamente"]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(["success" => false, "message" => "El email ya está registrado por otro usuario"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar en la base de datos"]);
    }
}