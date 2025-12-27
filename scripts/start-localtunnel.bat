@echo off
echo ========================================
echo   LocalTunnel - Automotriz Online
echo ========================================
echo.
echo Iniciando túnel para http://localhost:3000
echo.

REM Verificar si localtunnel está instalado
where lt >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: localtunnel no está instalado.
    echo.
    echo Instalando localtunnel...
    npm install -g localtunnel
    echo.
)

echo Iniciando túnel...
echo.
echo La URL aparecerá abajo. Cópiala y configúrala en la app.
echo.
echo Presiona Ctrl+C para detener el túnel.
echo.

lt --port 3000

pause


