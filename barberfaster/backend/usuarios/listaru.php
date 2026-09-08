<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    $sql = "SELECT id_usuario, nombre, email, telefono, rol, estado
            FROM Usuarios
            WHERE rol IS NULL OR LOWER(rol) <> 'cliente'
            ORDER BY id_usuario DESC";

    $stmt = $pdo->query($sql);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
    ]);
}
