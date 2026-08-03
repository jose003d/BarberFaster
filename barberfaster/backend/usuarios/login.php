<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);
$usuario = trim($data['usuario'] ?? $data['email'] ?? $data['username'] ?? '');
$password = $data['password'] ?? '';

if ($usuario === '' || $password === '') {
    echo json_encode(["success" => false, "error" => "Completa usuario y contraseña"]);
    exit;
}

try {
    $sql = "SELECT id_usuario, nombre, apellido, email, password_hash, telefono, documento, rol, estado
            FROM Usuarios
            WHERE email = :usuario OR nombre = :usuario
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([":usuario" => $usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos"]);
        exit;
    }

    $storedHash = $user['password_hash'] ?? '';
    $passwordOk = false;

    if (!empty($storedHash)) {
        $passwordOk = password_verify($password, $storedHash);
    }

    if (!$passwordOk && $storedHash === $password) {
        $passwordOk = true;
    }

    if (!$passwordOk) {
        echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos"]);
        exit;
    }

    unset($user['password_hash']);

    echo json_encode([
        "success" => true,
        "message" => "Inicio de sesión correcto",
        "user" => [
            "id_usuario" => $user['id_usuario'],
            "nombre" => $user['nombre'],
            "apellido" => $user['apellido'],
            "email" => $user['email'],
            "telefono" => $user['telefono'],
            "documento" => $user['documento'],
            "rol" => $user['rol'],
            "estado" => $user['estado']
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Error de autenticación: " . $e->getMessage()]);
}
?>
