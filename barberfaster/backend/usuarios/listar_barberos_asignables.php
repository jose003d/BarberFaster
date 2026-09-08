<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    // Solo usuarios activos con rol de barbero pueden aparecer en el select.
    $stmt = $pdo->query(
        "SELECT id_usuario, nombre, apellido, email
         FROM Usuarios
         WHERE LOWER(rol) = 'barbero' AND estado = 1
         ORDER BY nombre, apellido"
    );
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
