# Pagos en línea con Wompi (una cuenta por barbería)

Cada barbería cobra con **su propia cuenta de Wompi**: el dinero de sus clientes llega directo a ella, no a BarberFaster. La plataforma cobra su suscripción aparte.

## Configuración del servidor (una sola vez)

En el `.env` del servidor (fuera de `public_html`) o en `backend/.env` en XAMPP:

- `PAGOS_CLAVE_CIFRADO`: clave maestra que cifra las llaves de las barberías en la base de datos. Son 32 bytes en base64; genérala con `php -r "echo base64_encode(random_bytes(32)), PHP_EOL;"`. Guárdala con un respaldo seguro: si se pierde o cambia, cada barbería debe volver a pegar sus llaves.
- `WOMPI_REDIRECT_URL`: URL pública de la aplicación que termina en `/reservar`.

Las variables anteriores `WOMPI_ENV`, `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` ya no se usan; bórralas.

## Base de datos

Las migraciones automáticas `20261124120000_barberia_pasarelas.sql` y `20261124120100_wompi_pagos_ambiente.sql` crean la tabla de llaves por barbería y guardan el ambiente de cada pago. Para una instalación nueva ya están en `database/restore_database.sql`.

## Lo que hace cada barbería

1. Abre su cuenta en [Wompi](https://comercios.wompi.co) con sus propios datos y su cuenta bancaria.
2. En el panel de BarberFaster entra a **Pagos en línea** y pega, del mismo ambiente (*Desarrolladores → Llaves del API*): llave pública, llave privada, secreto de integridad y secreto de eventos.
3. Al guardar, el backend comprueba la llave pública y la privada contra Wompi y muestra el nombre de la cuenta. Los secretos se guardan cifrados y nunca se vuelven a mostrar.
4. Registra en Wompi (*Desarrolladores → URL de eventos*, mismo ambiente) la URL que muestra el panel: `https://<dominio>/…/backend/wompi/evento.php`. Es la misma para todas las barberías.
5. Recomendado: primero con llaves de pruebas (`sandbox`), una reserva completa; luego cambia a producción y vuelve a pegar las cuatro llaves.

Si una barbería no tiene llaves activas, la reserva solo ofrece **pagar en el local**.

## Flujo de pago

- `agendar_cita.php` firma el checkout con el secreto de integridad **de la barbería** y guarda en `wompi_pagos` el ambiente usado.
- `evento.php` (webhook común): busca la barbería por la referencia del pago y valida la firma con **su** secreto de eventos y el ambiente del evento antes de cambiar algo.
- `verificar_pago.php?id=…&barberia=…` (retorno del checkout): consulta la transacción con la **llave privada de la barbería**, así que solo encuentra pagos hechos a su cuenta, y exige que la referencia sea de una cita suya.
- La cita se confirma solo con estado `APPROVED`. Un pago aprobado después de expirar la reserva genera una notificación para revisión, sin reactivarla.
