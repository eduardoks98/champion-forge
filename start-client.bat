@echo off
title Champion Forge - Client
cd /d "%~dp0src\client"

REM Instalar dependencias se nao existir node_modules
if not exist "node_modules" (
    echo Instalando dependencias do cliente...
    call npm install
    echo.
)

echo Starting Champion Forge Client...
echo.
npm run dev -- --host
pause
