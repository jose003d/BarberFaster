<?php
// backend/config/cors.php
// Este archivo maneja los encabezados CORS para permitir que el frontend React
// haga peticiones al backend aunque estén en dominios o puertos diferentes.

// Permite solicitudes desde el origen que haga la petición.
// En muchos casos es el puerto del frontend (por ejemplo 5173).
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cachea esta configuración por 1 día
}

// Maneja las peticiones preflight tipo OPTIONS que hace el navegador antes de un POST/PUT/DELETE.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    // Permite los métodos HTTP que el navegador solicite.
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }

    // Permite los headers que el cliente quiera enviar, por ejemplo Content-Type o Authorization.
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    // Termina la ejecución aquí para responder al preflight.
    exit(0);
}