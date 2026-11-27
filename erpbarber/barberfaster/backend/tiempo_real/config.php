<?php
// Le dice al navegador si hay avisos en vivo y con qué llave pública conectarse.
// La llave (key) y el clúster de Pusher son públicos; el secreto nunca sale del servidor.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require_once __DIR__ . '/pusher.php';

$config = pusherConfiguracion();
echo json_encode([
    'status' => 'success',
    'datos' => $config === null
        ? ['activo' => false]
        : ['activo' => true, 'key' => $config['key'], 'cluster' => $config['cluster']],
]);
