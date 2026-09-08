<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    $sql = "SELECT b.id_barbero, b.id_usuario, b.id_barberia,
                   u.nombre, u.apellido, u.email, u.telefono, u.documento, u.foto, u.estado,
                   bar.nombre AS barberia
            FROM barberos b
            INNER JOIN Usuarios u ON u.id_usuario = b.id_usuario
            INNER JOIN barberias bar ON bar.id_barberia = b.id_barberia
            WHERE u.rol = 'barbero' AND u.estado = 1 AND bar.estado = 1
            ORDER BY u.nombre, u.apellido";

    echo json_encode($pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
