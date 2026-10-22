# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Instalación del frontend

Se requiere Node.js 20.19 o superior. No se sube `node_modules` a Git: npm lo descarga automáticamente usando el manifiesto y el lockfile incluidos.

En Windows, ejecuta `setup.bat` desde esta carpeta para instalar todas las dependencias. También puedes hacerlo desde una terminal:

```bash
npm ci
npm run dev
```

`npm ci` instala las versiones fijadas en `package-lock.json`; no hace falta instalar los paquetes uno por uno. `node_modules` permanece excluido por `.gitignore`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

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

Después de que una cita se marca como completada, el cliente puede calificar una vez al barbero con 1 a 5 estrellas desde su perfil, sin comentarios. Para bases existentes, crea la tabla `resenas` con la definición incluida en `restore_database.sql`; las instalaciones nuevas ya la crean con ese archivo.

## Perfil y citas del barbero

El perfil del barbero permite actualizar sus datos y consultar las citas próximas y el historial. La lista se actualiza cada 15 segundos mediante consultas HTTP periódicas; no es un WebSocket. Las acciones para cancelar, reagendar o completar desde el perfil permanecen desactivadas hasta contar con autenticación de barbero validada en el servidor.

Al consultar las citas, el servidor marca como completadas las citas pendientes o confirmadas cuyo horario ya terminó. El perfil consulta cada 15 segundos; si permanece cerrado, las citas vencidas se actualizan cuando vuelva a consultarse. Las canceladas no se modifican y no hace falta configurar tareas de Windows.

El endpoint de consulta no devuelve DNI ni teléfono, pero todavía no valida una sesión de barbero en el servidor. La edición de perfil y la carga de foto usan endpoints existentes que tampoco validan esa sesión. No expongas el panel a Internet hasta implementar la autenticación real; el modo de acceso actual es de demostración.

## Fotos de barberos

Las fotos se suben como archivos JPG, PNG o WebP de hasta 5 MB y sus bytes y MIME se guardan en `barberos.foto_datos` y `barberos.foto_mime` (MEDIUMBLOB). El endpoint `backend/barberos/foto.php` las sirve al flujo de Agenda. La columna `foto` se conserva para rutas antiguas. El SQL actualizado ya incluye las columnas necesarias para el almacenamiento binario.

## Galería de fotos de barberías

Desde el perfil del establecimiento se pueden guardar hasta 8 fotos JPG, PNG o WebP, de hasta 5 MB cada una, como archivos binarios en la tabla `barberia_fotos`. Las imágenes se alternan automáticamente en las tarjetas de barbería del inicio. En bases existentes, crea la tabla `barberia_fotos` con la definición incluida en `restore_database.sql`.

En el inicio, al pasar el cursor sobre una barbería o pulsar **Ver detalles**, se muestra su información pública, sus barberos activos y el mapa configurado.

El formulario completo del barbero guarda nombre, apellido, correo, teléfono, documento y especialidad. El SQL actualizado ya incluye esos campos en la tabla `barberos`.

`restore_database.sql` contiene únicamente la estructura exportada de la base local, sin registros y sin eliminar tablas existentes. Está pensado para una base vacía; `CREATE TABLE IF NOT EXISTS` no actualiza automáticamente tablas que ya tengan otra estructura.

Para habilitar la selección de días laborables en una base existente, ejecuta una sola vez este cambio sobre la base `barberfaster`:

```sql
ALTER TABLE barberias
  ADD COLUMN dias_trabajo VARCHAR(100) NOT NULL
  DEFAULT 'LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO';
```

No ejecutes el cambio si la columna ya existe. Las instalaciones nuevas incluyen `barberias.dias_trabajo` en `restore_database.sql`.

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
