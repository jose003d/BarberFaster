# Configuración de Wompi

La integración funciona en dos ambientes, elegidos con `WOMPI_ENV`:

| `WOMPI_ENV`  | Uso            | Llave pública | Secreto de integridad | Secreto de eventos |
|--------------|----------------|---------------|-----------------------|--------------------|
| `sandbox`    | Pruebas        | `pub_test_…`  | `test_integrity_…`    | `test_events_…`    |
| `production` | Cobros reales  | `pub_prod_…`  | `prod_integrity_…`    | `prod_events_…`    |

El backend rechaza llaves que no correspondan al ambiente elegido, para no mezclar pruebas con cobros reales.

## Variables

Van en `barberfaster-config.php` (en Hostinger, en `domains/barberfaster.site/`, fuera de `public_html`) o en `backend/config/config.local.php` en XAMPP. Nunca en React, archivos versionados ni en el chat:

- `WOMPI_ENV`: `sandbox` o `production`.
- `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`: en el panel de Wompi → *Desarrolladores → Llaves del API*, del mismo ambiente.
- `WOMPI_REDIRECT_URL`: URL pública de la aplicación que termina en `/reservar`.

## Base de datos

En una instalación existente, ejecuta una vez `database/migrations/20261109_wompi.sql` después de respaldar la base de datos. Para una instalación nueva, las tablas ya están incluidas en `database/restore_database.sql`.

## Webhook

Registra en el panel de Wompi, **en el mismo ambiente que las llaves**, la URL de eventos:

`https://<dominio-publico>/erpbarber/barberfaster/backend/wompi/evento.php`

Wompi requiere que el endpoint sea accesible desde internet mediante HTTPS. Para desarrollo local usa un túnel HTTPS temporal con llaves de sandbox; el webhook no puede llegar directamente a `localhost`.

## Paso a producción

1. Con `sandbox`, haz una reserva completa y confirma que la cita queda confirmada tras el pago.
2. Cambia `WOMPI_ENV` a `production` y reemplaza las tres llaves por las de producción.
3. Registra la URL de eventos en la sección de producción del panel de Wompi.
4. Haz un pago real de bajo valor y verifica que la cita se confirme.

## Flujo de pago

El backend calcula el total desde los servicios guardados, reserva el horario durante 10 minutos y entrega al checkout solo la llave pública, referencia, total en centavos COP y firma de integridad. La cita se confirma exclusivamente después de verificar el estado `APPROVED` con Wompi (en `sandbox.wompi.co` o `production.wompi.co` según el ambiente). Los pagos pendientes no confirman la cita; un pago aprobado después de expirar genera una notificación para revisión, sin reactivar la reserva.
