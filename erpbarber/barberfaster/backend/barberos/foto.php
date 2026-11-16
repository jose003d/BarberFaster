<?php
header('Content-Type: application/json; charset=UTF-8');
http_response_code(410);
echo json_encode([
    'status' => 'error',
    'mensaje' => 'El perfil del personal ya no almacena fotos en una tabla de barberos.',
]);
