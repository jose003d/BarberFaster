<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

$dni = $_GET['dni'] ?? null;
$codigo = $_GET['codigo'] ?? null;

if (!$dni || !$codigo) {
    echo json_encode(["success" => false, "error" => "Faltan parámetros"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, estado, valido_hasta FROM validaciones WHERE dni = :dni AND codigo = :codigo ORDER BY creado_at DESC LIMIT 1");
    $stmt->execute([':dni' => $dni, ':codigo' => $codigo]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(["success" => false, "error" => "Código inválido"]);
        exit;
    }
    if (isset($row['valido_hasta']) && $row['valido_hasta'] < date('Y-m-d H:i:s')) {
        echo json_encode(["success" => false, "error" => "Código expirado"]);
        exit;
    }
    // Marcar como verificado
    $pdo->prepare("UPDATE validaciones SET estado = 'VERIFICADO' WHERE id = :id")->execute([':id' => $row['id']]);
    echo json_encode(["success" => true, "message" => "Código verificado"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
