<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once "../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["error" => "No se recibieron datos del usuario en el backend"]);
    exit;
}

try {
    $sql = "INSERT INTO Usuarios (nombre, apellido, email, password_hash, telefono, documento, rol) 
            VALUES (:nombre, :apellido, :email, :password_hash, :telefono, :documento, :rol)";
    
    $stmt = $pdo->prepare($sql);
    
    $password = !empty($data['password']) ? $data['password'] : null;
    $passwordHash = $password ? password_hash($password, PASSWORD_DEFAULT) : null;
    $stmt->execute([
        ':nombre'        => !empty($data['nombre']) ? $data['nombre'] : null,
        ':apellido'      => !empty($data['apellido']) ? $data['apellido'] : null,
        ':email'         => !empty($data['email']) ? $data['email'] : null,
        ':password_hash' => $passwordHash,
        ':telefono'      => !empty($data['telefono']) ? $data['telefono'] : null,
        ':documento'     => !empty($data['documento']) ? $data['documento'] : null,
        ':rol'           => !empty($data['rol']) ? $data['rol'] : 'barbero'
    ]);
    
    $id_usuario = $pdo->lastInsertId();
    
    // Si el rol es cliente, crear también en tabla Clientes
    if (!empty($data['rol']) && $data['rol'] === 'cliente') {
        $sqlCliente = "INSERT INTO Clientes (dni, nombre, apellido, telefono, correo) 
        VALUES (:dni, :nombre, :apellido, :telefono, :correo)";
        $stmtCliente = $pdo->prepare($sqlCliente);
        $stmtCliente->execute([
            ':dni'      => $id_usuario,
            ':nombre'   => !empty($data['nombre']) ? $data['nombre'] : null,
            ':apellido' => !empty($data['apellido']) ? $data['apellido'] : null,
            ':telefono' => !empty($data['telefono']) ? $data['telefono'] : null,
            ':correo'   => !empty($data['email']) ? $data['email'] : null
        ]);
    }

    echo json_encode([
        "success" => true,
        "mensaje" => "Usuario registrado con éxito en el sistema",
        "id_usuario" => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    echo json_encode(["error" => "Error SQL en Usuarios: " . $e->getMessage()]);
    exit;
}
?>