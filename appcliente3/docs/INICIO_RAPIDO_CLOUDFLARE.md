# ⚡ Inicio Rápido con Cloudflare Tunnel

## 🎯 Pasos Rápidos

### 1. Descargar cloudflared

👉 **Ve a**: https://github.com/cloudflare/cloudflared/releases/latest

👉 **Descarga**: `cloudflared-windows-amd64.exe`

### 2. Colocar el archivo

1. Crea la carpeta: `C:\cloudflared\`
2. Mueve el archivo ahí
3. Renómbralo a: `cloudflared.exe`

### 3. Iniciar tu aplicación

En una terminal:
```bash
cd C:\Users\MUNDIAL DEL PC\Desktop\appfinal\appcliente1
pnpm dev
```

Espera a ver: `✓ Ready on http://localhost:3000`

### 4. Iniciar Cloudflare Tunnel

**Opción A: Usar el script** (Más fácil)
- Doble clic en: `scripts/start-cloudflare-tunnel.bat`

**Opción B: Manual**
En otra terminal:
```bash
C:\cloudflared\cloudflared.exe tunnel --url http://localhost:3000
```

### 5. Copiar la URL

Cloudflare mostrará algo como:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-name.trycloudflare.com                                                     |
+--------------------------------------------------------------------------------------------+
```

**Copia la URL HTTPS** (la que dice `https://...`)

### 6. Configurar en la aplicación

1. Abre tu app: http://localhost:3000
2. Inicia sesión como admin
3. Ve a: **Configuración** (botón en el panel)
4. Pega la URL de Cloudflare
5. Haz clic en **Guardar URL**

### 7. ¡Listo! 🎉

Ahora cuando envíes WhatsApp, la URL funcionará desde cualquier dispositivo.

---

## 🔄 Mantener el túnel corriendo

- **Mantén ambas terminales abiertas**:
  - Terminal 1: `pnpm dev` (tu aplicación)
  - Terminal 2: `cloudflared tunnel` (el túnel)

- Si cierras el túnel, la URL dejará de funcionar
- Si reinicias el túnel, obtendrás una nueva URL (actualiza en Configuración)

---

## 💡 Tip: URL Permanente

Si quieres una URL que no cambie, puedes autenticarte con Cloudflare:

```bash
cloudflared tunnel login
```

Luego crear un túnel con nombre:
```bash
cloudflared tunnel create mi-taller
```

Pero para empezar, la URL temporal funciona perfectamente.

---

## ❓ Problemas Comunes

### "cloudflared no se reconoce como comando"
- Asegúrate de haber colocado el archivo en `C:\cloudflared\cloudflared.exe`
- O agrega `C:\cloudflared` al PATH (ver INSTALAR_CLOUDFLARE.md)

### "No puedo acceder a la URL"
- Verifica que tu aplicación esté corriendo en `http://localhost:3000`
- Verifica que el túnel esté corriendo
- Espera unos segundos, puede tardar en estar disponible

### "La URL cambia cada vez"
- Es normal con la versión gratuita temporal
- Solo actualiza la URL en Configuración cuando cambie
- Para URL permanente, autentícate con Cloudflare (ver arriba)

