<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$dni = $data['dni'] ?? null;
$metodo = $data['metodo'] ?? 'sms';
$telefono = $data['telefono'] ?? null;
$correo = $data['correo'] ?? null;

if (!$dni) {
    echo json_encode(["success" => false, "error" => "Falta dni"]);
    exit;
}

try {
    $pdo->prepare("CREATE TABLE IF NOT EXISTS validaciones (id INT AUTO_INCREMENT PRIMARY KEY, dni VARCHAR(50), codigo VARCHAR(20), metodo VARCHAR(20), estado VARCHAR(20) DEFAULT 'PENDIENTE', creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, valido_hasta DATETIME)")->execute();

    $codigo = str_pad(strval(rand(0, 999999)), 6, '0', STR_PAD_LEFT);
    $validoHasta = (new DateTime())->modify('+10 minutes')->format('Y-m-d H:i:s');

    $insert = $pdo->prepare("INSERT INTO validaciones (dni, codigo, metodo, valido_hasta) VALUES (:dni, :codigo, :metodo, :valido_hasta)");
    $insert->execute([
        ':dni' => $dni,
        ':codigo' => $codigo,
        ':metodo' => $metodo,
        ':valido_hasta' => $validoHasta,
    ]);

    // Aquí se integraría con proveedor SMS/Email. En desarrollo devolvemos success.
    echo json_encode(["success" => true, "message" => "Código enviado", "debug_code" => $codigo]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
