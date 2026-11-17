<?php
// En Hostinger: copia este archivo como barberfaster-config.php en la carpeta del
// dominio, FUERA de public_html (domains/barberfaster.site/barberfaster-config.php).
// El despliegue por Git reemplaza public_html completo, así que un archivo dentro
// de public_html se borra en cada despliegue; fuera de él nunca se toca.
//
// En XAMPP también puedes copiarlo como config.local.php en esta misma carpeta.
//
// En XAMPP no necesitas crearlo: si no existe se usan root sin contraseña y la
// base "barberfaster".

return [
    // Base de datos (en Hostinger: hPanel > Bases de datos > MySQL)
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'u000000000_barberfaster',
    'DB_USER' => 'u000000000_usuario',
    'DB_PASS' => 'cambia-esta-contrasena',

    // Ruta donde vive el sitio. Déjalo en null para detectarla sola.
    // 'APP_BASE_PATH' => '/',

    // Dominios donde se permite el login SUPERADMIN (separados por coma).
    // Sin definirlo, el SUPERADMIN solo entra desde este equipo (XAMPP).
    // Incluye barberfaster.site para poder entrar al panel desde el logo del sitio público.
    // 'SUPERADMIN_HOSTS' => 'barbersuperadmin.tech,www.barbersuperadmin.tech,barberfaster.site,www.barberfaster.site',

    // Correo remitente para recuperación de contraseña y aprobaciones.
    'PASSWORD_RESET_FROM' => 'no-reply@tudominio.com',

    // SMTP para enviar los códigos de recuperación (recomendado en Hostinger).
    // Crea el buzón en hPanel > Correos y usa aquí su correo y contraseña.
    // El correo sale desde SMTP_USER. Sin estas líneas se usa mail() de PHP.
    // 'SMTP_HOST' => 'smtp.hostinger.com',
    // 'SMTP_PORT' => '465',
    // 'SMTP_USER' => 'no-reply@tudominio.com',
    // 'SMTP_PASS' => 'contraseña-del-buzón',

    // Wompi (pagos)
    'WOMPI_ENV' => 'sandbox',
    'WOMPI_PUBLIC_KEY' => '',
    'WOMPI_INTEGRITY_SECRET' => '',
    'WOMPI_EVENTS_SECRET' => '',
    'WOMPI_REDIRECT_URL' => 'https://tudominio.com/agenda',

    // Wuapi (códigos de verificación por WhatsApp/SMS)
    // 'WUAPI_API_KEY' => '',
];
