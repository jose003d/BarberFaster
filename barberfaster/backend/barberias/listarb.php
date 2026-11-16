<?php
// backend/barberias/listarb.php
// Este archivo consulta todas las barberías y las devuelve en formato JSON.
// Se usa para cargar la lista en el frontend, normalmente en tablas o cards.

// Permite que el frontend pueda consumir esta API desde otro dominio.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Incluye la conexión a la base de datos.
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

// Lee el parámetro ?activas=true o ?activas=false desde la URL.
// Si no llega, por defecto toma true.
$solo_activas = $_GET['activas'] ?? 'true';

try {
    if (!in_array($solo_activas, ['true', 'false'], true)) {
        http_response_code(422);
        echo json_encode(["status" => "error", "mensaje" => "El filtro de estado no es válido."]);
        exit();
    }

    if ($solo_activas === 'false') {
        requerirRol($pdo, ['SUPERADMIN']);
    }

    // Las citas ya guardan la barbería, así que las calificaciones no dependen
    // de la tabla de personal, que puede variar entre versiones del esquema.
    $sql = "
        SELECT
            barberias.id_barberia,
            barberias.nombre,
            barberias.direccion,
            barberias.ciudad,
            barberias.telefono,
            barberias.estado,
            barberias.foto,
            COALESCE(calificaciones.calificacion_promedio, 0) AS calificacion_promedio,
            COALESCE(calificaciones.cantidad_calificaciones, 0) AS cantidad_calificaciones
        FROM barberias
        LEFT JOIN (
            SELECT
                c.id_barberia,
                AVG(r.calificacion) AS calificacion_promedio,
                COUNT(r.id_resena) AS cantidad_calificaciones
            FROM citas c
            INNER JOIN resenas r ON r.id_cita = c.id_cita
            GROUP BY c.id_barberia
        ) AS calificaciones ON calificaciones.id_barberia = barberias.id_barberia";
    
    // Si se pide solo activas, agrega filtro por estado = ACTIVA.
    $parametros = [];
    if ($solo_activas === 'true') {
        $sql .= " WHERE barberias.estado = :estado";
        $parametros[':estado'] = 'ACTIVA';
    }
    
    // Ordena por nombre para que la lista salga organizada.
    $sql .= " ORDER BY barberias.nombre ASC";

    // Ejecuta la consulta.
    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);
    $barberias = $stmt->fetchAll();

    // Responde con los datos en JSON.
    echo json_encode([
        "status" => "success",
        "datos" => $barberias
    ]);
} catch (Throwable $error) {
    error_log('Error al listar barberías: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "mensaje" => "No se pudieron cargar las barberías."]);
}