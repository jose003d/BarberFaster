<?php
// backend/barberias/listarb.php
// Este archivo consulta todas las barberías y las devuelve en formato JSON.
// Se usa para cargar la lista en el frontend, normalmente en tablas o cards.

// Permite que el frontend pueda consumir esta API desde otro dominio.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Incluye la conexión a la base de datos.
require_once '../config/database.php';

// Lee el parámetro ?activas=true o ?activas=false desde la URL.
// Si no llega, por defecto toma true.
$solo_activas = $_GET['activas'] ?? 'true';

try {
    // Consulta base para traer todas las barberías.
    $sql = "SELECT id_barberia, nombre, direccion, ciudad, telefono, estado, foto FROM barberias";
    
    // Si se pide solo activas, agrega filtro por estado = ACTIVA.
    if ($solo_activas === 'true') {
        $sql .= " WHERE estado = 'ACTIVA'";
    }
    
    // Ordena por nombre para que la lista salga organizada.
    $sql .= " ORDER BY nombre ASC";

    // Ejecuta la consulta.
    $stmt = $pdo->query($sql);
    $barberias = $stmt->fetchAll();

    // Responde con los datos en JSON.
    echo json_encode([
        "status" => "success",
        "datos" => $barberias
    ]);
} catch (Exception $e) {
    // Si falla la consulta, devuelve el error en JSON.
    echo json_encode(["status" => "error", "mensaje" => "Error al listar barberías: " . $e->getMessage()]);
}