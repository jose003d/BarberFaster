<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    // El selector administrativo trabaja únicamente con barberías activas.
    $stmt = $pdo->query("SELECT id_barberia, nombre, direccion, ciudad, telefono, estado FROM barberias WHERE estado = 1 ORDER BY nombre");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
