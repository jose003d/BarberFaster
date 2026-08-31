<?php
// ==========================
// BLOQUE 1: Configuración de cabeceras y conexión
// ==========================
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once "../config/database.php";

try {
    // ==========================
    // BLOQUE 2: Recuperación automática de barberos
    // ==========================
    $barberosCount = (int) $pdo->query("SELECT COUNT(*) FROM barberos")->fetchColumn();

    if ($barberosCount === 0) {
        $usuariosBarberos = $pdo->query("SELECT id_usuario FROM Usuarios WHERE rol IN ('barbero', 'admin') AND estado = 1 ORDER BY id_usuario ASC")->fetchAll(PDO::FETCH_COLUMN);
        $barberias = $pdo->query("SELECT id_barberia FROM barberias WHERE estado = 1 ORDER BY id_barberia ASC")->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($usuariosBarberos) && !empty($barberias)) {
            $insertBarbero = $pdo->prepare("INSERT INTO barberos (id_usuario, id_barberia, especialidad) VALUES (:id_usuario, :id_barberia, 'General')");

            foreach ($usuariosBarberos as $index => $idUsuario) {
                $idBarberia = $barberias[$index % count($barberias)];
                $insertBarbero->execute([
                    ':id_usuario' => $idUsuario,
                    ':id_barberia' => $idBarberia,
                ]);
            }
        }
    }

    // ==========================
    // BLOQUE 3: Consulta de barberos activos
    // ==========================
    $sql = "
        SELECT 
            b.id_barbero, 
            b.id_usuario, 
            u.nombre, 
            u.apellido, 
            u.telefono, 
            u.rol,
            bar.nombre AS barberia
        FROM barberos b
        JOIN Usuarios u ON b.id_usuario = u.id_usuario
        JOIN barberias bar ON b.id_barberia = bar.id_barberia
        WHERE u.estado = 1
          AND u.rol = 'barbero'
          AND LOWER(TRIM(u.nombre)) = 'kleiser'
          AND LOWER(TRIM(u.apellido)) = 'regino'
        ORDER BY b.id_barbero ASC
    ";

    $stmt = $pdo->query($sql);

    // ==========================
    // BLOQUE 4: Respuesta en formato JSON
    // ==========================
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    // ==========================
    // BLOQUE 5: Manejo de errores
    // ==========================
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
