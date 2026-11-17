# Despliegue de BarberFaster (barberfaster.site)

```text
XAMPP (local) ──push main──▶ GitHub Actions (npm run build)
                                   │ publica el sitio armado
                                   ▼
                             rama "hostinger" ──Git de Hostinger──▶ public_html
```

Trabajas y pruebas en tu computador. Al hacer `git push` a `main`, GitHub Actions
compila el frontend y publica **frontend compilado + backend PHP** en la rama
`hostinger`, ya con la estructura de `public_html`. La integración Git de Hostinger
despliega esa rama. No hay que compilar ni subir nada a mano.

> **Importante:** Hostinger **no** ejecuta `npm run build`. Si desplegara `main`,
> publicaría el código fuente (`barberfaster/src`, `package.json`, SQL…) y no el sitio.
> Por eso en hPanel la rama configurada debe ser `hostinger`, nunca `main`.

## Dónde vive el sitio

- **Hosting:** Hostinger *Single Web Hosting* (no el VPS).
- **Carpeta pública:** `domains/barberfaster.site/public_html`

```text
domains/barberfaster.site/
├── barberfaster-config.php                     ← credenciales (FUERA de public_html)
└── public_html/
    ├── index.html, assets/, fonts/, favicon.png    ← frontend compilado (React)
    ├── .htaccess                                   ← rutas de React y HTTPS
    └── erpbarber/barberfaster/backend/             ← API PHP (la ruta que usa el frontend)
    ├── cli/migrate.php                         ← ejecutor CLI de migraciones
    ├── migrations/automatic/                   ← migraciones nuevas protegidas
    └── uploads/                                ← fotos que suben los usuarios
```

La API se llama en `https://barberfaster.site/erpbarber/barberfaster/backend/...`,
**la misma ruta que en XAMPP**. Por eso el mismo código funciona en los dos lados
(ver `barberfaster/.env.development` y `barberfaster/.env.production`).

> `barbersuperadmin.tech` (SuperAdmin en el VPS) es un proyecto aparte y este
> despliegue no lo toca.

## Configuración inicial (una sola vez)

### 0. Copia de seguridad

En hPanel → **Archivos → Copias de seguridad** (o el Administrador de archivos →
comprimir), guarda una copia de `public_html` antes del primer despliegue.

### 1. Crear `barberfaster-config.php` en el servidor ⚠️ antes del primer push

El backend lee la contraseña de MySQL y demás llaves de este archivo. Si no existe,
el sitio pierde la conexión a MySQL.

> **Debe ir FUERA de `public_html`.** La integración Git de Hostinger deja
> `public_html` idéntica a la rama `hostinger` en cada despliegue y **borra** lo que
> no está en ella, aunque esté en `.gitignore`. Un `config.local.php` dentro de
> `public_html/.../backend/config/` desaparece con cada push.

1. hPanel → **Administrador de archivos** → `domains/barberfaster.site/`
   (la carpeta que **contiene** a `public_html`, no la de adentro).
2. Crea ahí `barberfaster-config.php` con el contenido de
   `barberfaster/backend/config/config.example.php`. Pon los datos de MySQL,
   `SUPERADMIN_HOSTS`, `PASSWORD_RESET_FROM` y las llaves de Wompi/Wuapi si las usas.
   Si no tienes la contraseña de MySQL, cámbiala en hPanel → **Bases de datos → Administración**.

`backend/config/env.php` busca primero ese archivo y, si no existe, usa
`backend/config/config.local.php` (útil en XAMPP).

### 2. Primer push (crea la rama `hostinger`)

```bash
git push origin main
```

En la pestaña **Actions** del repositorio espera a que termine "Desplegar en
Hostinger". Al terminar existe la rama `hostinger` con este contenido en la raíz:
`index.html`, `assets/`, `fonts/`, `.htaccess`, `erpbarber/barberfaster/backend/`.

### 3. Configurar Git en hPanel

hPanel → **Avanzado → GIT**:

1. Si ya hay un repositorio conectado con la rama `main`, **bórralo** de la lista
   (esto no borra archivos).
2. Respalda en tu PC, desde el Administrador de archivos:
   - `public_html/erpbarber/barberfaster/backend/config/config.local.php`
     (o los datos de MySQL del `database.php` actual)
   - `public_html/erpbarber/barberfaster/backend/uploads/` y `.../public/`
3. Hostinger solo clona en una carpeta **vacía**: vacía `public_html`.
4. Crea el repositorio en GIT:
   - Repositorio: `https://github.com/jose003d/BarberFaster.git`
   - Rama: **`hostinger`**
   - Directorio: vacío (= `public_html`)
5. Pulsa **Deploy**, luego **Auto Deployment** y copia la URL del webhook en GitHub →
   **Settings → Webhooks → Add webhook** (Content type `application/json`, evento *push*).
6. Vuelve a subir las carpetas `uploads/`/`public/` a su lugar. La configuración va
   en `domains/barberfaster.site/barberfaster-config.php` (paso 1), no aquí.
   ⚠️ Revisa después de un despliegue que las fotos sigan ahí: si Hostinger borra
   archivos no versionados, también afecta a `uploads/` y `public/`.

Desde ahí cada push a `main` → Actions compila → actualiza `hostinger` → el webhook
hace que Hostinger publique.

### FTP (alternativa opcional)

Si prefieres no usar la integración Git, crea los secretos `FTP_SERVER`,
`FTP_USERNAME`, `FTP_PASSWORD` (y la variable `FTP_SERVER_DIR`) en GitHub →
**Settings → Secrets and variables → Actions**; el workflow subirá además por FTP.
No uses los dos métodos a la vez sobre la misma carpeta.

## Trabajo diario en local

1. Inicia **Apache** y **MySQL** en XAMPP.
2. En `barberfaster/`:

   ```bash
   npm run dev
   ```

   Abre `http://localhost:5173`.
3. Cuando esté listo:

   ```bash
   git add -A
   git commit -m "Describe el cambio"
   git push origin main
   ```

### Cambios en la base de datos

El despliegue no copia datos de XAMPP a producción. Las migraciones históricas en
`barberfaster/database/migrations/` tampoco se ejecutan automáticamente.

Para cambios futuros, agrega **un archivo por sentencia SQL** en
`barberfaster/backend/migrations/automatic/`, por ejemplo
`20261117120000_agregar_estado.sql`. No edites ni borres una migración que ya se
aplicó; crea otra nueva. El workflow incluye esta carpeta en el despliegue.

Para que Hostinger aplique esas migraciones, configura en hPanel → **Avanzado →
Cron Jobs** una tarea que ejecute el script PHP CLI cada 5 minutos:

```text
php /home/USUARIO/domains/barberfaster.site/public_html/erpbarber/barberfaster/backend/cli/migrate.php
```

Reemplaza `USUARIO` por el usuario real de tu hosting. Usa la versión de PHP del
sitio si hPanel te permite seleccionarla. El ejecutor procesa solo archivos nuevos
de `backend/migrations/automatic/`, registra su versión y checksum en
`barberfaster_schema_migrations`, y no vuelve a ejecutarlos. También bloquea el
acceso web directo a los archivos SQL. El usuario MySQL de `barberfaster-config.php`
necesita permisos para crear tablas, consultar e insertar en la base de datos.

Antes de activar el cron, haz una copia de seguridad desde hPanel → **Archivos →
Copias de seguridad** o **Bases de datos**. La migración histórica
`20261116_estado_clientes.sql` sigue siendo manual y debe revisarse por separado;
no la copies a la carpeta automática sin confirmar primero si ya fue aplicada.

## Si algo no carga en línea

| Síntoma                                      | Causa probable / solución                                                                              |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| "No se pudo conectar a la base de datos"     | Falta o está mal `domains/barberfaster.site/barberfaster-config.php` (fuera de public_html).           |
| 404 al recargar `/agenda` u otra ruta        | Falta `public_html/.htaccess` (viene en el despliegue).                                                 |
| Un endpoint devuelve HTML en vez de JSON     | Ese `.php` no está en el servidor: revisa que esté en Git y que el workflow haya terminado bien.        |
| Una barbería sin foto o con "—"              | No tiene fotos en `barberia_fotos` o no tiene reseñas; no es un error.                                  |
| Pagos Wompi fallan                           | Faltan `WOMPI_*` en `barberfaster-config.php`.                                                                 |
| No llega el código de recuperación         | Crea el buzón en hPanel → Correos y pon `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en `barberfaster-config.php`. Revisa spam. |
| El login SUPERADMIN falla en barberfaster.site | Falta `barberfaster.site,www.barberfaster.site` en `SUPERADMIN_HOSTS` de `barberfaster-config.php`. |

Los errores de PHP se ven en hPanel → **Avanzado → Registros de errores**.
