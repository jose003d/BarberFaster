# Servidor de tiempo real de BarberFaster

Servidor WebSocket propio (Node.js + `ws`) para la agenda en vivo del barbero. No usa
servicios externos ni cuentas: solo necesita Node y un secreto compartido con el backend PHP.

```text
Cliente agenda ──▶ PHP (hosting) guarda la cita ──POST /publicar──▶ este servidor ──WebSocket──▶ barbero
```

- **PHP publica** en `POST /publicar` con `Authorization: Bearer <TIEMPO_REAL_SECRETO>`.
- **El navegador del barbero** se conecta a `/ws?token=…`. PHP firma ese token con el mismo
  secreto (`backend/tiempo_real/config.php`) y solo permite escuchar el canal `barbero-<id>`
  de quien inició sesión. El token vence a las 12 horas; la página pide uno nuevo al reconectar.
- **`GET /salud`** responde `{"ok":true,"conexiones":N}` para revisar que esté vivo.
- Si este servidor se cae, la agenda no se rompe: se actualiza cada 15 segundos y se
  reconecta sola cuando vuelve.

El hosting compartido (*Single Web Hosting*) no puede mantener este proceso encendido, por
eso este servidor corre en el **VPS** (o en tu computador para probar). Esta carpeta está
fuera de `barberfaster/`, así que el despliegue a Hostinger no la sube.

## Variables

| Variable | Obligatoria | Ejemplo |
|---|---|---|
| `TIEMPO_REAL_SECRETO` | Sí | 64 caracteres hex, el mismo del `.env` del backend |
| `PUERTO` | No (8090) | `8090` |
| `ORIGENES_PERMITIDOS` | No, pero recomendado | `https://barberfaster.site` |

Genera el secreto una vez:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Probar en tu computador (XAMPP)

1. En `barberfaster/backend/.env` agrega:

   ```ini
   TIEMPO_REAL_WS_URL=ws://localhost:8090/ws
   TIEMPO_REAL_PUBLICAR_URL=http://localhost:8090/publicar
   TIEMPO_REAL_SECRETO=<el secreto>
   ```

2. Enciende el servidor (PowerShell):

   ```powershell
   cd servidor-tiempo-real
   npm install
   $env:TIEMPO_REAL_SECRETO = "<el secreto>"; $env:ORIGENES_PERMITIDOS = "http://localhost:5173"; npm start
   ```

3. Entra como barbero a "Mi agenda": arriba debe decir **En vivo**.

## Dejarlo en el VPS (Ubuntu)

Como el sitio usa `https`, el navegador exige `wss://` (WebSocket con certificado). Se pone
Nginx delante con un subdominio, por ejemplo `tiempo-real.barberfaster.site`.

1. **DNS:** en hPanel → Dominios → DNS de `barberfaster.site`, crea un registro **A**
   `tiempo-real` que apunte a la IP del VPS.

2. **Código y dependencias** (en el VPS):

   ```bash
   sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
   sudo mkdir -p /opt/barberfaster-tiempo-real
   # copia servidor.js, package.json y package-lock.json a esa carpeta (scp o git)
   cd /opt/barberfaster-tiempo-real && sudo npm ci --omit=dev
   ```

3. **Servicio que arranca solo** — `/etc/systemd/system/barberfaster-tiempo-real.service`:

   ```ini
   [Unit]
   Description=BarberFaster tiempo real (WebSocket)
   After=network.target

   [Service]
   WorkingDirectory=/opt/barberfaster-tiempo-real
   ExecStart=/usr/bin/node servidor.js
   Environment=PUERTO=8090
   Environment=ORIGENES_PERMITIDOS=https://barberfaster.site
   Environment=TIEMPO_REAL_SECRETO=<el secreto>
   Restart=always
   User=www-data

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now barberfaster-tiempo-real
   curl http://127.0.0.1:8090/salud
   ```

4. **Nginx** — `/etc/nginx/sites-available/tiempo-real`:

   ```nginx
   server {
       server_name tiempo-real.barberfaster.site;

       location / {
           proxy_pass http://127.0.0.1:8090;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_read_timeout 120s;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/tiempo-real /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d tiempo-real.barberfaster.site
   ```

5. **Backend en Hostinger** — en `domains/barberfaster.site/.env`:

   ```ini
   TIEMPO_REAL_WS_URL=wss://tiempo-real.barberfaster.site/ws
   TIEMPO_REAL_PUBLICAR_URL=https://tiempo-real.barberfaster.site/publicar
   TIEMPO_REAL_SECRETO=<el mismo secreto>
   ```

6. Revisa `https://tiempo-real.barberfaster.site/salud` y entra como barbero: debe decir
   **En vivo**.
