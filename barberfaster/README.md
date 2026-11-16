## Estructura del proyecto

Para publicar en Hostinger y el flujo local → GitHub → servidor, consulta [DESPLIEGUE.md](../DESPLIEGUE.md).

El código está organizado por módulos de negocio. El frontend vive en `src/features/`; cada módulo puede contener `pages/`, `components/` y `utils/`. Las piezas reutilizables entre módulos están en `src/shared/`.

```text
src/
├── features/
│   ├── agenda/       # Agenda, disponibilidad y selección de horarios
│   ├── auth/         # Inicio de sesión, sesión y rutas protegidas
│   ├── barberias/    # Descubrimiento y administración de barberías
│   ├── barberos/     # Personal y espacio del barbero
│   ├── clientes/     # Clientes, perfil y calificaciones
│   ├── dashboard/    # Paneles generales y de administración
│   ├── superadmin/   # Panel y solicitudes de superadministración
│   └── usuarios/     # Gestión de usuarios
├── shared/           # API, layout y componentes compartidos
├── assets/           # Imágenes, video y fuentes
├── styles/           # Estilos globales (App, index, buttons)
├── App.jsx           # Enrutamiento de la aplicación
└── main.tsx          # Punto de entrada

backend/
├── agenda/ barberias/ barberos/ citas/ clientes/ usuarios/ servicios/
├── Auth/ verificacion/ resenas/ dashboard/ notificaciones/ wompi/
├── config/           # database.php, env.php y config.example.php (copia a config.local.php)
├── uploads/ public/  # Archivos subidos por usuarios (ignorados por Git)
└── cors.php

database/
├── restore_database.sql  # Esquema completo para instalaciones nuevas
└── migrations/           # Cambios incrementales del esquema SQL

scripts/
└── setup.bat         # Instala las dependencias del frontend en Windows

public/               # Estáticos copiados al build (incluye el .htaccess de producción)
build/                # Salida de `npm run build` (servida por .htaccess, ignorada por Git)
```

El backend PHP ya está separado por dominio; conserva sus URLs actuales para que el frontend y la instalación existente sigan funcionando. Al añadir una función, ubica sus páginas, componentes y utilidades dentro del módulo correspondiente, y mueve a `shared/` solo lo que realmente se reutilice.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Instalación del frontend

Se requiere Node.js 20.19 o superior. No se sube `node_modules` a Git: npm lo descarga automáticamente usando el manifiesto y el lockfile incluidos.

En Windows, ejecuta `scripts/setup.bat` para instalar todas las dependencias. También puedes hacerlo desde una terminal:

```bash
npm ci
npm run dev
```

`npm ci` instala las versiones fijadas en `package-lock.json`; no hace falta instalar los paquetes uno por uno. `node_modules` permanece excluido por `.gitignore`.

### Publicación en `barberfaster.site`

El frontend se publica en la raíz del dominio y la API PHP permanece en `/erpbarber/barberfaster/backend`. El router y Vite usan la raíz (`/`); la URL de la API se mantiene en `src/shared/services/api.js`. No muevas el backend ni publiques el código fuente como frontend.

El workflow `.github/workflows/deploy-frontend.yml` compila el frontend cuando se suben cambios a `main` y copia únicamente el contenido de `build/` a la carpeta pública. Para habilitarlo, configura en GitHub Actions estos secretos:

- `VPS_HOST`: IP o hostname del VPS.
- `VPS_USER`: usuario SSH de despliegue; evita usar `root`.
- `VPS_SSH_PRIVATE_KEY`: clave privada SSH del usuario de despliegue.
- `VPS_KNOWN_HOSTS`: huella de host SSH verificada del VPS.
- `VPS_DEPLOY_PATH`: directorio público del dominio, por ejemplo `/www/wwwroot/barberfaster.site`.

La cuenta de despliegue debe poder escribir los archivos estáticos del frontend en esa carpeta, pero no debe tener permisos para modificar el backend ni la base de datos. No guardes contraseñas ni claves privadas en el repositorio. El workflow no despliega PHP ni ejecuta migraciones.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Autenticación

La autenticación del personal está en `backend/Auth/`: `login.php`, `sesion.php`, `logout.php`, `cambiar_contrasena.php`, `solicitar_recuperacion.php` y `restablecer_contrasena.php`. El inicio de sesión acepta el documento (máximo 30 caracteres) o el correo (máximo 120), valida la contraseña almacenada en `usuarios.password`, y solo permite cuentas activas con rol `SUPERADMIN`, `ADMINISTRADOR` o `BARBERO`. Administradores y barberos pueden cambiar su propia contraseña desde Mi perfil, confirmando la contraseña actual, o recuperarla desde el enlace del login mediante un código enviado al correo registrado. El código vence en 15 minutos, se invalida después de usarse y permite hasta cinco intentos; solo se puede solicitar uno por minuto. La cuenta SUPERADMIN no puede cambiar ni recuperar su contraseña desde la plataforma. Las cuentas creadas al aprobar una solicitud deben cambiar la contraseña temporal antes de usar el panel; el backend bloquea las demás operaciones de esas cuentas hasta completar el cambio. Las rutas antiguas bajo `backend/usuarios/` se conservan como compatibilidad.

La recuperación y los correos de aprobación requieren que PHP tenga configurado `mail()` con un servidor SMTP o relay saliente y que Apache defina un remitente válido. En XAMPP para Windows, consulta la configuración de Gmail en la sección siguiente. En instalaciones existentes, aplica una sola vez `database/migrations/20261109_recuperacion_contrasena.sql`. Las instalaciones nuevas incluyen la tabla en `database/restore_database.sql`.

El acceso al perfil del cliente es independiente: valida el DNI y el teléfono registrados en `clientes` y confirma un código de WhatsApp de 6 dígitos. El cliente no requiere ni almacena contraseña. El DNI colombiano acepta únicamente dígitos (máximo 10) y el nombre hasta 100 caracteres. Los teléfonos de contacto aceptan hasta 20 caracteres; para WhatsApp y reservas se valida el número celular colombiano. Los correos opcionales deben tener formato válido.

## Superadministración y solicitudes de barberías

La portada ofrece accesos al panel superadmin y al formulario público para solicitar la incorporación de una barbería. Las solicitudes quedan pendientes hasta que un superadmin las apruebe o rechace. Aprobar crea, en una sola transacción, la barbería activa y su usuario administrador. Después, se envían al correo registrado los datos del negocio, el documento de acceso y la contraseña temporal; al iniciar sesión, el administrador debe cambiarla. Si el envío falla, el panel lo informa y muestra la contraseña temporal como respaldo de un solo uso. El envío utiliza `PASSWORD_RESET_FROM` y el servicio de correo configurado para PHP `mail()` en Apache. Los clientes mantienen su acceso por OTP.

### Gmail SMTP en XAMPP (Windows)

1. Activa la verificación en dos pasos de la cuenta Google remitente y genera una contraseña de aplicación. Usa esa contraseña, no la contraseña normal de Gmail. No compartas la contraseña de aplicación ni la guardes en el repositorio.
2. Edita `C:\xampp\sendmail\sendmail.ini`:

   ```ini
   smtp_server=smtp.gmail.com
   smtp_port=587
   smtp_ssl=tls
   auth_username=tu-cuenta@gmail.com
   auth_password=TU_CONTRASENA_DE_APLICACION
   force_sender=tu-cuenta@gmail.com
   ```

3. En `C:\xampp\php\php.ini`, dentro de `[mail function]`, configura:

   ```ini
   sendmail_path="\"C:\xampp\sendmail\sendmail.exe\" -t"
   ```

4. En un archivo de configuración de Apache que se incluya (por ejemplo, `C:\xampp\apache\conf\extra\httpd-wompi.conf`), define el remitente con la misma cuenta Gmail:

   ```apache
   SetEnv PASSWORD_RESET_FROM "tu-cuenta@gmail.com"
   ```

5. Guarda los archivos y reinicia Apache desde el panel de XAMPP. Prueba primero la recuperación de contraseña; después, aprueba una solicitud de prueba.

La cuenta Gmail debe permitir contraseñas de aplicación (requiere verificación en dos pasos y puede estar restringida por políticas de Google Workspace). No habilites “aplicaciones menos seguras”. Si la autenticación falla, revisa `C:\xampp\sendmail\error.log`. Las credenciales SMTP quedan en texto plano en `sendmail.ini`; limita el acceso a ese archivo y nunca lo subas a Git ni lo compartas.

En instalaciones existentes, aplica una vez `database/migrations/20261103_superadmin_solicitudes.sql` para añadir el identificador de usuario requerido por la autenticación, el indicador de cambio obligatorio de contraseña y crear la tabla de solicitudes. En instalaciones nuevas, el esquema de usuarios y solicitudes está incluido en `database/restore_database.sql`.

Configura o actualiza la cuenta definitiva ejecutando `backend/Auth/configurar_superadmin.php` desde CLI después de definir `SUPERADMIN_PASSWORD` en el entorno local. La contraseña se almacena como hash en la base de datos y nunca debe guardarse en el código fuente ni en Git. El identificador de acceso es `SUPERADMIN`; `SUPERADMIN_EMAIL` es opcional si la cuenta aún no existe. El configurador deja desactivado el cambio obligatorio de contraseña de esta cuenta.

## Integración Wuapi

La aplicación ya incluye un flujo OTP para enviar y verificar códigos por WhatsApp usando Wuapi.

Requisitos:

- Instalar la extensión `curl` en PHP/XAMPP.
- Definir estas variables de entorno en Apache antes de arrancar el servidor:

```apache
SetEnv WUAPI_ACCOUNT_ID "tu_account_id_aqui"
SetEnv WUAPI_API_KEY "tu_api_key_aqui"
```

Endpoints activos:

- `backend/verificacion/solicitar.php`
- `backend/verificacion/verificar.php`
- Compatibilidad: `backend/clientes/enviar_codigo.php` y `backend/clientes/verificar_codigo.php`

La API guarda el OTP temporalmente en un archivo JSON del sistema durante 5 minutos y envía mensajes a través de `https://api.wuapi.dev/v1/messages` usando un bearer token (`WUAPI_API_KEY`) y el `WUAPI_ACCOUNT_ID` en el cuerpo de la solicitud.

El formulario de reservas solicita y verifica el código por WhatsApp antes de permitir confirmar una cita. La reserva vuelve a validar en el backend que el teléfono coincida con el código y requiere un ticket de un solo uso, válido por 10 minutos. El código OTP no se devuelve en la respuesta de envío.

## Perfil del cliente

El enlace **Mi perfil** de la portada lleva a `/cliente`. El cliente ingresa su nombre, DNI y teléfono registrado, y confirma un código OTP enviado por WhatsApp. El DNI identifica el registro y no se modifica en este flujo. Al completar el OTP, si el DNI y el teléfono coinciden con un cliente existente, se actualiza el nombre de ese mismo registro y se inicia una sesión temporal de 30 minutos. El backend valida el token, el DNI y el teléfono antes de devolver su perfil o sus citas.

Mientras esa sesión esté vigente, Agenda reutiliza los datos del perfil y permite reservar sin solicitar otro código. Si la reserva comienza sin una sesión activa, conserva la verificación OTP y crea la sesión al completar la cita.

Desde el perfil puede cancelar o cambiar la fecha y hora de citas pendientes o confirmadas. La reprogramación mantiene el barbero y los servicios originales, y el servidor valida duración, horario de atención, que la cita aún no haya pasado y que el nuevo turno no esté ocupado.

Después de que una cita se marca como completada, el cliente puede calificar una vez al barbero con 1 a 5 estrellas desde su perfil, sin comentarios. Para bases existentes, crea la tabla `resenas` con la definición incluida en `database/restore_database.sql`; las instalaciones nuevas ya la crean con ese archivo.

## Perfil y citas del barbero

El perfil del barbero permite actualizar sus datos y consultar las citas próximas y el historial. La lista se actualiza cada 15 segundos mediante consultas HTTP periódicas; no es un WebSocket. Las acciones para cancelar, reagendar o completar desde el perfil permanecen desactivadas hasta contar con autenticación de barbero validada en el servidor.

Al consultar las citas, el servidor marca como completadas las citas pendientes o confirmadas cuyo horario ya terminó. El perfil consulta cada 15 segundos; si permanece cerrado, las citas vencidas se actualizan cuando vuelva a consultarse. Las canceladas no se modifican y no hace falta configurar tareas de Windows.

El endpoint de consulta no devuelve DNI ni teléfono, pero todavía no valida una sesión de barbero en el servidor. La edición de perfil y la carga de foto usan endpoints existentes que tampoco validan esa sesión. No expongas el panel a Internet hasta implementar la autenticación real; el modo de acceso actual es de demostración.

## Fotos de barberos

Las fotos se suben como archivos JPG, PNG o WebP de hasta 5 MB y sus bytes y MIME se guardan en `barberos.foto_datos` y `barberos.foto_mime` (MEDIUMBLOB). El endpoint `backend/barberos/foto.php` las sirve al flujo de Agenda. La columna `foto` se conserva para rutas antiguas. El SQL actualizado ya incluye las columnas necesarias para el almacenamiento binario.

## Galería de fotos de barberías

Desde el perfil del establecimiento se pueden guardar hasta 8 fotos JPG, PNG o WebP, de hasta 5 MB cada una, como archivos binarios en la tabla `barberia_fotos`. Las imágenes se alternan automáticamente en las tarjetas de barbería del inicio. En bases existentes, crea la tabla `barberia_fotos` con la definición incluida en `database/restore_database.sql`.

En el inicio, al pasar el cursor sobre una barbería o pulsar **Ver detalles**, se muestra su información pública, sus barberos activos y el mapa configurado.

El formulario completo del barbero guarda nombre, apellido, correo, teléfono, documento y especialidad. El SQL actualizado ya incluye esos campos en la tabla `barberos`.

`database/restore_database.sql` contiene únicamente la estructura exportada de la base local, sin registros y sin eliminar tablas existentes. Está pensado para una base vacía; `CREATE TABLE IF NOT EXISTS` no actualiza automáticamente tablas que ya tengan otra estructura.

Para habilitar la selección de días laborables en una base existente, ejecuta una sola vez este cambio sobre la base `barberfaster`:

```sql
ALTER TABLE barberias
  ADD COLUMN dias_trabajo VARCHAR(100) NOT NULL
  DEFAULT 'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO';
```

No ejecutes el cambio si la columna ya existe. Las instalaciones nuevas incluyen `barberias.dias_trabajo` en `database/restore_database.sql`.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
