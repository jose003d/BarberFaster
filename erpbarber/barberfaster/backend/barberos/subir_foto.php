<?php
header('Content-Type: application/json; charset=UTF-8');
http_response_code(410);
echo json_encode([
    'status' => 'error',
    'mensaje' => 'La tabla usuarios no tiene campos para almacenar fotos de barberos.',
]);
