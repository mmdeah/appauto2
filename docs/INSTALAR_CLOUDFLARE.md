# 🚀 Instalar Cloudflare Tunnel (cloudflared)

## Opción 1: Descarga Manual (Recomendado - Sin permisos de admin)

### Paso 1: Descargar cloudflared

1. Ve a: https://github.com/cloudflare/cloudflared/releases/latest
2. Busca: `cloudflared-windows-amd64.exe` (o `cloudflared-windows-386.exe` si tienes Windows de 32 bits)
3. Descarga el archivo

### Paso 2: Colocar el archivo

1. Crea una carpeta: `C:\cloudflared\`
2. Mueve el archivo descargado ahí
3. Renómbralo a: `cloudflared.exe`

### Paso 3: Agregar al PATH (Opcional pero recomendado)

1. Presiona `Win + R`
2. Escribe: `sysdm.cpl` y presiona Enter
3. Ve a la pestaña "Opciones avanzadas"
4. Haz clic en "Variables de entorno"
5. En "Variables del sistema", busca "Path" y haz clic en "Editar"
6. Haz clic en "Nuevo"
7. Agrega: `C:\cloudflared`
8. Haz clic en "Aceptar" en todas las ventanas
9. **Reinicia la terminal** para que tome efecto

### Paso 4: Verificar instalación

Abre una nueva terminal y ejecuta:
```bash
cloudflared --version
```

Si muestra la versión, ¡está instalado correctamente!

---

## Opción 2: Usar Chocolatey (Requiere permisos de admin)

1. Abre PowerShell o CMD **como Administrador**
2. Ejecuta:
   ```bash
   choco install cloudflared -y
   ```

---

## Opción 3: Usar Scoop (Sin permisos de admin)

Si tienes Scoop instalado:
```bash
scoop install cloudflared
```

---

## ✅ Una vez instalado

Puedes usar el script que creamos:
- Doble clic en: `scripts/start-cloudflare-tunnel.bat`

O ejecutar manualmente:
```bash
cloudflared tunnel --url http://localhost:3000
```


