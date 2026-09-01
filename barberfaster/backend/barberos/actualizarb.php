<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data) && isset($_POST)) {
    $data = $_POST;
}

$id_barbero = $data['id_barbero'] ?? null;
$id_usuario = $data['id_usuario'] ?? null;
$id_barberia = $data['id_barberia'] ?? null;
$especialidad = $data['especialidad'] ?? null;

if (!$id_barbero) {
    echo json_encode(["success" => false, "error" => "Falta el id_barbero"]);
    exit;
}

$sql = "UPDATE barberos 
        SET id_usuario = :id_usuario,
            id_barberia = :id_barberia,
            especialidad = :especialidad 
        WHERE id_barbero = :id_barbero";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':id_usuario'   => $id_usuario,
    ':id_barberia'  => $id_barberia,
    ':especialidad' => $especialidad,
    ':id_barbero'   => $id_barbero
]);

echo json_encode(["success" => true]);
?>