@echo off
title Champion Forge - Server
cd /d "%~dp0src\server"

REM Instalar dependencias se nao existir node_modules
if not exist "node_modules" (
    echo Instalando dependencias do servidor...
    call npm install
    echo.
)

echo Starting Champion Forge Server...
echo.
npm run dev
pause
