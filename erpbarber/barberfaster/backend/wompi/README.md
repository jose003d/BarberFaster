# Configuración de Wompi en sandbox

La integración solo permite el ambiente de pruebas (`sandbox`). No configures llaves de producción.

## Variables de entorno

Configura estas variables en el entorno de Apache/PHP, no en React, archivos versionados ni en el chat:

- `WOMPI_ENV=sandbox`
- `WOMPI_PUBLIC_KEY`: llave pública de pruebas con prefijo `pub_test_`.
- `WOMPI_INTEGRITY_SECRET`: secreto de integridad de sandbox.
- `WOMPI_EVENTS_SECRET`: secreto de eventos de sandbox.
- `WOMPI_REDIRECT_URL`: URL pública de la aplicación que termina en `/reservar`.

En Windows con XAMPP, las variables pueden declararse con `SetEnv` en la configuración de Apache y luego reiniciar Apache. No guardes los valores reales en este archivo.

## Base de datos

En una instalación existente, ejecuta una vez `database/migrations/20261109_wompi.sql` después de respaldar la base de datos. Para una instalación nueva, las tablas ya están incluidas en `database/restore_database.sql`.

## Webhook

Registra en el panel sandbox de Wompi este endpoint:

`https://<dominio-publico>/erpbarber/barberfaster/backend/wompi/evento.php`

Wompi requiere que el endpoint sea accesible desde internet mediante HTTPS. Para desarrollo local usa un túnel HTTPS temporal; el webhook no puede llegar directamente a `localhost`. Mantén también las llaves de sandbox al probar mediante el túnel.

## Flujo de pago

El backend calcula el total desde los servicios guardados, reserva el horario durante 10 minutos y entrega al checkout solo la llave pública, referencia, total en centavos COP y firma de integridad. La cita se confirma exclusivamente después de verificar el estado `APPROVED` con Wompi. Los pagos pendientes no confirman la cita; un pago aprobado después de expirar genera una notificación para revisión, sin reactivar la reserva.
