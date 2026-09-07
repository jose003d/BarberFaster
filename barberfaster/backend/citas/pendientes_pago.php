<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    $sql = "SELECT c.id_cita, c.fecha_creacion, cl.nombre, cl.apellido, e.start_datetime, e.servicio
            FROM citas c
            JOIN clientes cl ON c.clientes_dni = cl.dni
            JOIN eventos e ON c.id_evento = e.id_evento
            LEFT JOIN pagos p ON p.id_cita = c.id_cita
            WHERE p.id_pago IS NULL
            ORDER BY e.start_datetime DESC";
    echo json_encode(["success" => true, "citas" => $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
