<?php
header("Content-Type: application/json");
require_once "../cors.php";
require_once "../config/database.php";

try {
    $columns = $pdo->query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'barberias'"
    )->fetchAll(PDO::FETCH_COLUMN);
    $available = array_fill_keys($columns, true);
    $select = ['id_barberia', 'nombre'];
    foreach (['direccion', 'descripcion', 'estado', 'datos_contacto'] as $column) {
        if (isset($available[$column])) {
            $select[] = $column;
        }
    }

    $where = isset($available['estado']) ? ' WHERE estado = 1' : '';
    $stmt = $pdo->query(
        'SELECT ' . implode(', ', $select) . ' FROM barberias' . $where . ' ORDER BY nombre'
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
        $contact = [];
        if (!empty($row['datos_contacto'])) {
            $decoded = json_decode($row['datos_contacto'], true);
            if (is_array($decoded)) {
                $contact = $decoded;
            }
        }

        $row['ciudad'] = $contact['ciudad'] ?? '';
        $row['telefono'] = $contact['telefono'] ?? '';
    }

    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
