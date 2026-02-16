@echo off
echo ========================================
echo   Cloudflare Tunnel - Automotriz Online
echo ========================================
echo.
echo Iniciando túnel para http://localhost:3000
echo.

REM Verificar si cloudflared está instalado
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    REM Intentar usar la ruta local común
    if exist "C:\cloudflared\cloudflared.exe" (
        set PATH=%PATH%;C:\cloudflared
    ) else (
        echo ERROR: cloudflared no está instalado.
        echo.
        echo Por favor instala cloudflared:
        echo 1. Descarga desde: https://github.com/cloudflare/cloudflared/releases/latest
        echo 2. Busca: cloudflared-windows-amd64.exe
        echo 3. Colócalo en: C:\cloudflared\cloudflared.exe
        echo 4. O sigue las instrucciones en: INSTALAR_CLOUDFLARE.md
        echo.
        pause
        exit /b 1
    )
)

echo Iniciando túnel...
echo.
echo La URL aparecerá abajo. Cópiala y configúrala en la app.
echo.
echo Presiona Ctrl+C para detener el túnel.
echo.

cloudflared tunnel --url http://localhost:3000

pause

