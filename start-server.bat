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

REM Allow self-signed certificates in development (Caddy local SSL)
set NODE_TLS_REJECT_UNAUTHORIZED=0

npm run dev
pause
