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
    $sql = "
        SELECT
            barberias.id_barberia,
            barberias.nombre,
            barberias.direccion,
            barberias.ciudad,
            barberias.telefono,
            barberias.estado,
            barberias.foto,
            (
                SELECT AVG(r.calificacion)
                FROM barberos b
                INNER JOIN citas c ON c.id_barbero = b.id_barbero
                INNER JOIN resenas r ON r.id_cita = c.id_cita
                WHERE b.id_barberia = barberias.id_barberia
                  AND b.estado = 'ACTIVO'
            ) AS calificacion_promedio,
            (
                SELECT COUNT(r.id_resena)
                FROM barberos b
                INNER JOIN citas c ON c.id_barbero = b.id_barbero
                INNER JOIN resenas r ON r.id_cita = c.id_cita
                WHERE b.id_barberia = barberias.id_barberia
                  AND b.estado = 'ACTIVO'
            ) AS cantidad_calificaciones
        FROM barberias";
    
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