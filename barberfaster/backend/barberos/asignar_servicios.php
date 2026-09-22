<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// GET: Obtener los IDs de servicios asignados a un barbero
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_barbero = $_GET['id_barbero'] ?? null;
    if (!$id_barbero) {
        echo json_encode(["status" => "error", "mensaje" => "ID de barbero requerido."]);
        exit();
    }

    $stmt = $pdo->prepare("SELECT id_servicio FROM barbero_servicios WHERE id_barbero = ?");
    $stmt->execute([$id_barbero]);
    $servicios = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(["status" => "success", "servicios" => $servicios]);
    exit();
}

// POST: Actualizar masivamente las asignaciones del barbero
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id_barbero = $data['id_barbero'] ?? null;
    $servicios_ids = $data['servicios_ids'] ?? []; // Array de IDs de servicios

    if (!$id_barbero) {
        echo json_encode(["status" => "error", "mensaje" => "ID de barbero es obligatorio."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        // Limpiar asignaciones previas del barbero
        $stmtDelete = $pdo->prepare("DELETE FROM barbero_servicios WHERE id_barbero = ?");
        $stmtDelete->execute([$id_barbero]);

        // Insertar las nuevas asignaciones seleccionadas
        if (!empty($servicios_ids)) {
            $stmtInsert = $pdo->prepare("INSERT INTO barbero_servicios (id_barbero, id_servicio) VALUES (?, ?)");
            foreach ($servicios_ids as $id_servicio) {
                $stmtInsert->execute([$id_barbero, $id_servicio]);
            }
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "mensaje" => "Asignaciones actualizadas correctamente."]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "mensaje" => "Error al asignar servicios: " . $e->getMessage()]);
    }
}
?>