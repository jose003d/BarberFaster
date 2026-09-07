<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $idCita = (int) ($_GET['id_cita'] ?? 0);
    if (!$idCita) {
        echo json_encode(["success" => false, "error" => "Falta el id de la cita"]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT s.id_servicio, s.nombre, s.precio, s.duracion_minutos FROM servicios_has_citas sc JOIN servicios s ON s.id_servicio = sc.Servicios_id_servicio WHERE sc.Citas_id_cita = :cita ORDER BY s.nombre");
    $stmt->execute([':cita' => $idCita]);
    echo json_encode(["success" => true, "servicios" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
