<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    if (empty($data['id_cita']) || !isset($data['monto']) || empty($data['metodo'])) {
        echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO pagos (id_cita, monto, metodo, estado, fecha_pago) VALUES (:cita, :monto, :metodo, 'PAGADO', NOW())");
    $stmt->execute([':cita' => (int) $data['id_cita'], ':monto' => (float) $data['monto'], ':metodo' => trim($data['metodo'])]);
    echo json_encode(["success" => true, "id_pago" => (int) $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
