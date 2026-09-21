<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    // Validar las dos llaves foráneas antes de crear la asignación.
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $idUsuario = (int) ($data['id_usuario'] ?? 0);
    $idBarberia = (int) ($data['id_barberia'] ?? 0);
    $perfil = trim((string) ($data['perfil'] ?? ''));

    if (!$idUsuario || !$idBarberia) {
        echo json_encode(["success" => false, "error" => "Selecciona un usuario y una barbería"]);
        exit;
    }

    $usuarioStmt = $pdo->prepare("SELECT id_usuario, nombre, apellido FROM usuarios WHERE id_usuario = :id_usuario AND rol = 'barbero' AND estado = 1 LIMIT 1");
    $usuarioStmt->execute([':id_usuario' => $idUsuario]);
    $usuario = $usuarioStmt->fetch(PDO::FETCH_ASSOC);
    if (!$usuario) {
        echo json_encode(["success" => false, "error" => "El usuario seleccionado no es un barbero activo"]);
        exit;
    }

    $barberiaStmt = $pdo->prepare("SELECT id_barberia FROM barberias WHERE id_barberia = :id_barberia AND estado = 1 LIMIT 1");
    $barberiaStmt->execute([':id_barberia' => $idBarberia]);
    if (!$barberiaStmt->fetch()) {
        echo json_encode(["success" => false, "error" => "La barbería seleccionada no está activa"]);
        exit;
    }

    $duplicateStmt = $pdo->prepare("SELECT id_barbero FROM barberos WHERE id_usuario = :id_usuario LIMIT 1");
    $duplicateStmt->execute([':id_usuario' => $idUsuario]);
    if ($duplicateStmt->fetch()) {
        echo json_encode(["success" => false, "error" => "El usuario ya está asignado como barbero"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO barberos (id_usuario, id_barberia, nombre, perfil) VALUES (:id_usuario, :id_barberia, :nombre, :perfil)");
    $stmt->execute([
        ':id_usuario' => $idUsuario,
        ':id_barberia' => $idBarberia,
        ':nombre' => trim($usuario['nombre'] . ' ' . ($usuario['apellido'] ?? '')),
        ':perfil' => $perfil,
    ]);

    echo json_encode(["success" => true, "id_barbero" => (int) $pdo->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
