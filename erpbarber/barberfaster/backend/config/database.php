<?php
// backend/config/database.php
// Las credenciales salen de config.local.php (ver config.example.php).
// Sin ese archivo se usan los valores por defecto de XAMPP.

require_once __DIR__ . '/env.php';

$host    = configValor('DB_HOST', 'localhost');
$db      = configValor('DB_NAME', 'barberfaster');
$user    = configValor('DB_USER', 'root');
$pass    = configValor('DB_PASS', '') ?? '';
$charset = "utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
} catch (\PDOException $e) {
    error_log('Error de conexión a la base de datos: ' . $e->getMessage());
    if (PHP_SAPI === 'cli') {
        fwrite(STDERR, "No se pudo conectar a la base de datos. Revisa backend/config/config.local.php.\n");
        exit(1);
    }

    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "mensaje" => "No se pudo conectar a la base de datos. Revisa backend/config/config.local.php."
    ]);
    exit();
}
