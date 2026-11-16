# Despliegue de BarberFaster (barberfaster.site)

```text
XAMPP (local)  ──git push main──▶  GitHub  ──GitHub Actions (FTP)──▶  Hostinger
```

Trabajas y pruebas en tu computador. Al hacer `git push` a `main`, GitHub compila el
frontend y sube **frontend + backend PHP** a Hostinger. No hay que compilar ni subir
nada a mano.

## Dónde vive el sitio

- **Hosting:** Hostinger *Single Web Hosting* (no el VPS).
- **Carpeta pública:** `domains/barberfaster.site/public_html`

```text
public_html/
├── index.html, assets/, fonts/, favicon.png    ← frontend compilado (React)
├── .htaccess                                   ← rutas de React y HTTPS
└── erpbarber/barberfaster/backend/             ← API PHP (la ruta que usa el frontend)
    ├── config/config.local.php                 ← SOLO en el servidor (credenciales)
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

### 1. Crear `config.local.php` en el servidor ⚠️ antes del primer push

El despliegue reemplaza `backend/config/database.php` por la versión del
repositorio, que ya **no** lleva la contraseña escrita: la lee de
`config.local.php`. Si ese archivo no existe, el sitio pierde la conexión a MySQL.

1. hPanel → **Administrador de archivos** →
   `public_html/erpbarber/barberfaster/backend/config/`.
2. Abre el `database.php` actual del servidor y copia el nombre de la base, el usuario
   y la contraseña.
   Si no está la contraseña, cámbiala en hPanel → **Bases de datos → Administración**.
3. Crea en esa misma carpeta `config.local.php` con el contenido de
   `barberfaster/backend/config/config.example.php`. Pon los datos de MySQL,
   `PASSWORD_RESET_FROM` y las llaves de Wompi/Wuapi si las usas.

Este archivo **no** está en Git y el despliegue nunca lo sobrescribe ni lo borra.

### 2. Cuenta FTP

hPanel → **Archivos → Cuentas FTP**. Anota el **host FTP**, el **usuario** y la
**contraseña**. Mira también la columna **Directorio** de la cuenta: indica en qué
carpeta "aterriza" el FTP.

### 3. Secretos y variables en GitHub

En el repositorio → **Settings → Secrets and variables → Actions**:

| Pestaña   | Nombre           | Valor                                                         |
|-----------|------------------|---------------------------------------------------------------|
| Secrets   | `FTP_SERVER`     | Host FTP                                                      |
| Secrets   | `FTP_USERNAME`   | Usuario FTP                                                   |
| Secrets   | `FTP_PASSWORD`   | Contraseña FTP                                                |
| Variables | `FTP_SERVER_DIR` | Ruta de `public_html` vista desde el FTP (termina en `/`)     |
| Variables | `FTP_PROTOCOL`   | (opcional) `ftp` por defecto, o `ftps`                        |

Valores de `FTP_SERVER_DIR` según el **Directorio** de la cuenta FTP:

- Si el directorio es `public_html` del dominio → `./`
- Si es la carpeta del usuario (`/home/u…`) → `domains/barberfaster.site/public_html/`
- Si no pones nada → `public_html/`

### 4. Primer despliegue

```bash
git push origin main
```

El progreso se ve en la pestaña **Actions** del repositorio. También se puede lanzar
a mano con **Run workflow**. Los archivos viejos del servidor (por ejemplo
`assets/index-BVI9vft4.js`) no se borran; quedan sin uso.

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

El despliegue **no** toca la base de datos. Si agregas una migración en
`barberfaster/database/migrations/`, ejecútala una vez en el phpMyAdmin de Hostinger.
Pendiente hoy: `20261116_estado_clientes.sql` (columna `estado` de clientes, necesaria
para `clientes/desactivarc.php`).

## Si algo no carga en línea

| Síntoma                                      | Causa probable / solución                                                                              |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------|
| "No se pudo conectar a la base de datos"     | Falta o está mal `backend/config/config.local.php` en el servidor.                                     |
| 404 al recargar `/agenda` u otra ruta        | Falta `public_html/.htaccess` (viene en el despliegue).                                                 |
| Un endpoint devuelve HTML en vez de JSON     | Ese `.php` no está en el servidor: revisa que esté en Git y que el workflow haya terminado bien.        |
| Una barbería sin foto o con "—"              | No tiene fotos en `barberia_fotos` o no tiene reseñas; no es un error.                                  |
| Pagos Wompi fallan                           | Faltan `WOMPI_*` en `config.local.php`.                                                                 |
| El panel SUPERADMIN no abre en barberfaster.site | Es intencional: solo funciona desde `localhost` (`esSolicitudLocal()` en `backend/Auth/common.php`). |

Los errores de PHP se ven en hPanel → **Avanzado → Registros de errores**.
