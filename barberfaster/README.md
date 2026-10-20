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

El enlace **Mi perfil** de la portada lleva a `/cliente`. El cliente ingresa su nombre, DNI y teléfono registrado, y confirma un código OTP enviado por WhatsApp. Tras verificarlo, recibe una sesión temporal de 30 minutos; el backend valida esa sesión y que los datos correspondan al registro del cliente antes de devolver su perfil o sus citas.

Desde el perfil puede cancelar o cambiar la fecha y hora de citas pendientes o confirmadas. La reprogramación mantiene el barbero y los servicios originales, y el servidor valida duración, horario de atención, que la cita aún no haya pasado y que el nuevo turno no esté ocupado.

## Fotos de barberos

Las fotos de perfil se guardan en `backend/uploads/barberos` y se aceptan imágenes JPG, PNG y WebP de hasta 5 MB. Para bases de datos existentes, ejecuta una vez `migration_add_barbero_foto.sql`; las instalaciones nuevas incluyen la columna `foto` en `restore_database.sql`.

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
