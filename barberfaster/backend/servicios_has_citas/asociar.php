<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $idCita = (int) ($data['id_cita'] ?? 0);
    $ids = array_values(array_filter(array_map('intval', $data['servicios_ids'] ?? [])));
    if (!$idCita || !$ids) {
        echo json_encode(["success" => false, "error" => "La cita y al menos un servicio son obligatorios"]);
        exit;
    }
    $pdo->beginTransaction();
    $delete = $pdo->prepare("DELETE FROM servicios_has_citas WHERE Citas_id_cita = :cita");
    $delete->execute([':cita' => $idCita]);
    $insert = $pdo->prepare("INSERT INTO servicios_has_citas (Servicios_id_servicio, Citas_id_cita) VALUES (:servicio, :cita)");
    foreach (array_unique($ids) as $idServicio) {
        $insert->execute([':servicio' => $idServicio, ':cita' => $idCita]);
    }
    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
