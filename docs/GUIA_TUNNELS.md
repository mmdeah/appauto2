# 🌐 Guía de Túneles para Exponer tu Aplicación

Hay varias opciones para crear un túnel y exponer tu aplicación local a internet. Aquí están las mejores opciones:

---

## 1. Cloudflare Tunnel (cloudflared) ⭐ RECOMENDADO

**Cloudflare Tunnel** es **completamente gratis**, sin límites de tiempo, y muy fácil de usar.

### Ventajas:
- ✅ **100% Gratis** - Sin límites
- ✅ **URL permanente** (puedes elegir subdominio)
- ✅ **HTTPS incluido**
- ✅ **Sin necesidad de cuenta paga**
- ✅ **Muy rápido y confiable**

### Instalación:

#### Windows:
1. Descarga desde: https://github.com/cloudflare/cloudflared/releases
2. Busca `cloudflared-windows-amd64.exe`
3. Renómbralo a `cloudflared.exe`
4. Colócalo en una carpeta (ej: `C:\cloudflared\`)

#### O usando Chocolatey:
```bash
choco install cloudflared
```

#### O usando Scoop:
```bash
scoop install cloudflared
```

### Uso Básico (URL Temporal):

```bash
cloudflared tunnel --url http://localhost:3000
```

Esto te dará una URL temporal como: `https://random-name.trycloudflare.com`

### Uso Avanzado (URL Permanente):

1. **Autenticarse:**
   ```bash
   cloudflared tunnel login
   ```
   Esto abrirá tu navegador para autenticarte con Cloudflare.

2. **Crear un túnel:**
   ```bash
   cloudflared tunnel create mi-taller
   ```

3. **Configurar el túnel:**
   ```bash
   cloudflared tunnel route dns mi-taller taller.mi-dominio.com
   ```
   (Solo si tienes un dominio en Cloudflare)

4. **Iniciar el túnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

### Para URL Permanente sin dominio:

Puedes usar un subdominio de Cloudflare:
```bash
cloudflared tunnel --url http://localhost:3000 --hostname mi-taller.cfargotunnel.com
```

---

## 2. localtunnel (npm) 🚀

**localtunnel** es muy simple y rápido de usar.

### Instalación:
```bash
npm install -g localtunnel
```

### Uso:
```bash
lt --port 3000
```

O con un subdominio personalizado:
```bash
lt --port 3000 --subdomain mi-taller
```

**Ventajas:**
- ✅ Muy simple
- ✅ Gratis
- ✅ Subdominio personalizable

**Desventajas:**
- ⚠️ Puede tener tiempos de inactividad
- ⚠️ Menos estable que Cloudflare

---

## 3. ngrok (Ya mencionado) 🔧

### Instalación:
```bash
npm install -g ngrok
```

### Uso:
```bash
ngrok http 3000
```

**Ventajas:**
- ✅ Muy popular y confiable
- ✅ Interfaz web para monitoreo

**Desventajas:**
- ⚠️ Con cuenta gratuita: URL cambia al reiniciar
- ⚠️ Límites de conexiones simultáneas

---

## 4. VS Code Port Forwarding (Si usas VS Code) 💻

Si usas Visual Studio Code:

1. Abre la paleta de comandos: `Ctrl+Shift+P`
2. Busca: "Ports: Focus on Ports View"
3. Haz clic en "Forward a Port"
4. Ingresa: `3000`
5. VS Code creará un túnel automáticamente

**Ventajas:**
- ✅ Integrado en VS Code
- ✅ Muy fácil

**Desventajas:**
- ⚠️ Solo si usas VS Code
- ⚠️ URL temporal

---

## 5. Túnel SSH Manual (Avanzado) 🔐

Si tienes un servidor con acceso SSH:

```bash
ssh -R 80:localhost:3000 usuario@tu-servidor.com
```

**Ventajas:**
- ✅ Control total
- ✅ URL permanente

**Desventajas:**
- ❌ Requiere servidor propio
- ❌ Más complejo de configurar

---

## 📊 Comparación Rápida

| Túnel | Gratis | URL Permanente | Facilidad | Recomendado |
|-------|--------|----------------|-----------|-------------|
| **Cloudflare** | ✅ Sí | ✅ Sí | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **localtunnel** | ✅ Sí | ⚠️ Parcial | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **ngrok** | ⚠️ Limitado | ❌ No (gratis) | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **VS Code** | ✅ Sí | ❌ No | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recomendación Final

**Para la mayoría de casos: Cloudflare Tunnel**

1. Es completamente gratis
2. Puedes tener URL permanente
3. Muy confiable y rápido
4. Sin límites

### Pasos Rápidos con Cloudflare:

```bash
# 1. Descargar cloudflared (ver arriba)

# 2. Iniciar túnel simple (URL temporal)
cloudflared tunnel --url http://localhost:3000

# 3. Copiar la URL que te muestra
# 4. Configurarla en la app (Admin → Configuración)
```

---

## 🔄 Actualizar el Código para Cloudflare

El código que ya creamos funciona con cualquier túnel. Solo necesitas:

1. Iniciar el túnel (Cloudflare, ngrok, etc.)
2. Copiar la URL
3. Configurarla en: **Admin → Configuración**
4. ¡Listo!

---

## ❓ ¿Cuál elegir?

- **Cloudflare**: Si quieres lo mejor gratis
- **localtunnel**: Si quieres algo muy simple
- **ngrok**: Si ya lo conoces o necesitas la interfaz web
- **VS Code**: Si desarrollas en VS Code


