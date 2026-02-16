@echo off
echo ========================================
echo   ngrok - Automotriz Online
echo ========================================
echo.
echo Iniciando túnel para http://localhost:3000
echo.

REM Verificar si ngrok está instalado
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok no está instalado.
    echo.
    echo Por favor instala ngrok:
    echo 1. Descarga desde: https://ngrok.com/download
    echo 2. O usa: npm install -g ngrok
    echo.
    pause
    exit /b 1
)

echo Iniciando túnel...
echo.
echo La URL aparecerá abajo. Cópiala y configúrala en la app.
echo.
echo Presiona Ctrl+C para detener el túnel.
echo.

ngrok http 3000

pause


