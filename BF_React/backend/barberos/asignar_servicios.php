<?php
// Este archivo gestiona la relación entre barberos y servicios.
// Permite consultar qué servicios tiene asignado un barbero y también actualizarlos.

// CORS para permitir que React haga peticiones desde localhost:5173.
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Responde a la petición OPTIONS para evitar errores de CORS en el navegador.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a la base de datos.
require_once '../config/database.php';

// GET: Obtiene los servicios que ya están asignados al barbero.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_barbero = $_GET['id_barbero'] ?? null;
    if (!$id_barbero) {
        echo json_encode(["status" => "error", "mensaje" => "ID de barbero requerido."]);
        exit();
    }

    // Busca los id_servicio asociados a ese barbero.
    $stmt = $pdo->prepare("SELECT id_servicio FROM barbero_servicios WHERE id_barbero = ?");
    $stmt->execute([$id_barbero]);
    $servicios = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Devuelve en JSON los servicios asignados.
    echo json_encode(["status" => "success", "servicios" => $servicios]);
    exit();
}

// POST: Actualiza todas las asignaciones del barbero.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Lee el JSON enviado desde el frontend.
    $data = json_decode(file_get_contents("php://input"), true);
    $id_barbero = $data['id_barbero'] ?? null;
    $servicios_ids = $data['servicios_ids'] ?? []; // Array de IDs de servicios

    if (!$id_barbero) {
        echo json_encode(["status" => "error", "mensaje" => "ID de barbero es obligatorio."]);
        exit();
    }

    try {
        // Inicia una transacción para asegurar consistencia.
        $pdo->beginTransaction();

        // Elimina las asignaciones anteriores del barbero.
        $stmtDelete = $pdo->prepare("DELETE FROM barbero_servicios WHERE id_barbero = ?");
        $stmtDelete->execute([$id_barbero]);

        // Inserta las nuevas asignaciones seleccionadas.
        if (!empty($servicios_ids)) {
            $stmtInsert = $pdo->prepare("INSERT INTO barbero_servicios (id_barbero, id_servicio) VALUES (?, ?)");
            foreach ($servicios_ids as $id_servicio) {
                $stmtInsert->execute([$id_barbero, $id_servicio]);
            }
        }

        // Confirma la operación.
        $pdo->commit();
        echo json_encode(["status" => "success", "mensaje" => "Asignaciones actualizadas correctamente."]);
    } catch (Exception $e) {
        // Si algo falla, revierte todo para evitar datos inconsistentes.
        $pdo->rollBack();
        echo json_encode(["status" => "error", "mensaje" => "Error al asignar servicios: " . $e->getMessage()]);
    }
}
?>