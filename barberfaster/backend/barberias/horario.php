<?php
// backend/barberia/horario.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id_barberia = $_GET['id_barberia'] ?? 1;

    try {
        $stmt = $pdo->prepare("SELECT id_barberia, nombre, hora_apertura, hora_cierre FROM barberias WHERE id_barberia = ?");
        $stmt->execute([$id_barberia]);
        $barberia = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($barberia) {
            echo json_encode(["status" => "success", "data" => $barberia]);
        } else {
            echo json_encode(["status" => "error", "mensaje" => "Barbería no encontrada."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id_barberia = $data['id_barberia'] ?? 1;
    $hora_apertura = $data['hora_apertura'] ?? '08:00:00';
    $hora_cierre = $data['hora_cierre'] ?? '19:00:00';

    try {
        $stmt = $pdo->prepare("UPDATE barberias SET hora_apertura = ?, hora_cierre = ? WHERE id_barberia = ?");
        $stmt->execute([$hora_apertura, $hora_cierre, $id_barberia]);

        echo json_encode(["status" => "success", "mensaje" => "Horario de atención actualizado correctamente."]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
    }
}
?>