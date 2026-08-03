@echo off
REM Eliminar App.tsx
del "src\App.tsx"
echo App.tsx eliminado exitosamente
REM Instalar react-router-dom
call npm install react-router-dom
echo Dependencias instaladas
pause
