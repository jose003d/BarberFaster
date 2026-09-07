<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $idCita = (int) ($data['id_cita'] ?? 0);
    $calificacion = (int) ($data['calificacion'] ?? 0);
    if (!$idCita || $calificacion < 1 || $calificacion > 5) {
        echo json_encode(["success" => false, "error" => "La cita y una calificación entre 1 y 5 son obligatorias"]);
        exit;
    }
    $stmt = $pdo->prepare("SELECT clientes_dni FROM citas WHERE id_cita = :cita");
    $stmt->execute([':cita' => $idCita]);
    $cita = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$cita || !$cita['clientes_dni']) {
        echo json_encode(["success" => false, "error" => "Cita no encontrada"]);
        exit;
    }
    $insert = $pdo->prepare("INSERT INTO resenas (id_cita, clientes_dni, calificacion, comentario) VALUES (:cita, :dni, :calificacion, :comentario)");
    $insert->execute([':cita' => $idCita, ':dni' => $cita['clientes_dni'], ':calificacion' => $calificacion, ':comentario' => trim($data['comentario'] ?? '')]);
    echo json_encode(["success" => true, "id_resena" => (int) $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
