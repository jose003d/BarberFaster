@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Error: instala Node.js 20.19 o superior antes de continuar.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Error: npm no esta disponible. Reinstala Node.js y habilita npm en PATH.
  pause
  exit /b 1
)

echo Instalando las dependencias del frontend desde package-lock.json...
call npm ci
if errorlevel 1 (
  echo Error: no se pudieron instalar las dependencias.
  pause
  exit /b 1
)

echo.
echo Dependencias instaladas. Para iniciar el frontend ejecuta: npm run dev
pause