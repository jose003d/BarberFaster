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

if (!isset($_FILES['foto']) || !isset($_POST['id_usuario'])) {
    echo json_encode(["success" => false, "error" => "Faltan datos"]);
    exit;
}

$idUsuario = $_POST['id_usuario'];
$file = $_FILES['foto'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "error" => "Error al subir la imagen"]);
    exit;
}

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
if (!in_array($file['type'], $allowed, true)) {
    echo json_encode(["success" => false, "error" => "Formato no permitido"]);
    exit;
}

$targetDir = dirname(__DIR__) . '/public/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'avatar_' . $idUsuario . '_' . time() . '.' . $extension;
$targetPath = $targetDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(["success" => false, "error" => "No se pudo guardar la imagen"]);
    exit;
}

try {
    $sql = "UPDATE Usuarios SET foto = :foto WHERE id_usuario = :id_usuario";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':foto' => $filename,
        ':id_usuario' => $idUsuario,
    ]);

    echo json_encode(["success" => true, "foto" => $filename]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
