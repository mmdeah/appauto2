# 🚂 Configurar Servidor JSON en Railway

Guía paso a paso para desplegar tu app con servidor JSON directamente en Railway.

## 📋 Arquitectura

```
Railway Project
├── Servicio 1: Next.js App (tu aplicación)
└── Servicio 2: JSON Server (base de datos)
```

## 🚀 Pasos para Desplegar

### Paso 1: Desplegar Servidor JSON

1. **En Railway Dashboard:**
   - Ve a tu proyecto
   - Click en **"+ New"** → **"Empty Service"**
   - Selecciona **"Deploy from GitHub repo"**
   - Elige tu repositorio: `mmdeah/appauto2`
   - En **"Root Directory"**, escribe: `server`
   - Railway detectará automáticamente que es Node.js

2. **Configurar el servicio:**
   - Railway ejecutará automáticamente:
     - `npm install` (en la carpeta `server/`)
     - `npm start` (que ejecuta `node server.js`)

3. **Obtener URL del servicio:**
   - Railway asignará una URL como: `https://json-server-production-xxxx.up.railway.app`
   - **Guarda esta URL** - la necesitarás para el siguiente paso

### Paso 2: Configurar Variables en Next.js

1. **En tu servicio Next.js:**
   - Ve a **"Variables"**
   - Agrega esta variable:
     ```
     JSON_SERVER_URL=https://json-server-production-xxxx.up.railway.app
     ```
   - O mejor aún, usa la **variable interna de Railway**:
     - Railway crea automáticamente variables para servicios conectados
     - Busca `JSON_SERVER_SERVICE_URL` o similar

### Paso 3: Conectar los Servicios

1. **En Railway:**
   - Ve a tu servicio Next.js
   - Click en **"Settings"** → **"Networking"**
   - Agrega el servicio JSON Server como dependencia
   - Esto creará variables de entorno automáticamente

2. **Variables automáticas:**
   - Railway crea: `JSON_SERVER_SERVICE_URL` o similar
   - Úsala en lugar de la URL pública

### Paso 4: Modificar tu App Next.js

Necesitas crear las API Routes que conecten con el servidor JSON.

Ya están creadas en:
- `app/api/orders/route.ts`
- `app/api/upload-photo/route.ts`

Solo asegúrate de que usen la variable de entorno:

```typescript
const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';
```

## 🔧 Configuración Avanzada

### Variables de Entorno Recomendadas

En el servicio JSON Server:
```
PORT=3001
NODE_ENV=production
```

En el servicio Next.js:
```
JSON_SERVER_URL=<URL del servicio JSON>
NODE_ENV=production
PORT=3000
```

### Persistencia de Datos

El servidor JSON guarda datos en:
- `db.json` - Base de datos
- `photos/` - Fotos subidas

Railway mantiene estos archivos mientras el servicio esté activo.

**⚠️ Importante:** Si eliminas el servicio, perderás los datos. Considera hacer backups periódicos.

### Backup de Datos

Puedes hacer backup del `db.json`:
1. Conecta al servicio JSON
2. Descarga el archivo `db.json`
3. O usa Railway's volume storage (plan pago)

## 📊 Monitoreo

- **Logs:** Ve a cada servicio → "Logs"
- **Métricas:** Railway muestra CPU, RAM, etc.
- **Health checks:** Railway verifica que los servicios estén corriendo

## 🔄 Actualizaciones

Cada vez que hagas push a GitHub:
- Railway desplegará ambos servicios automáticamente
- El servidor JSON se reiniciará (pero los datos persisten)

## 🐛 Solución de Problemas

### El servidor JSON no inicia
- Verifica los logs en Railway
- Asegúrate de que `server/package.json` tenga el script `start`
- Verifica que `server/server.js` exista

### Next.js no puede conectar al JSON Server
- Verifica la variable `JSON_SERVER_URL`
- Asegúrate de que ambos servicios estén en el mismo proyecto
- Usa la URL interna si están conectados

### Fotos no se guardan
- Verifica que la carpeta `photos/` tenga permisos de escritura
- Revisa los logs del servidor JSON
- Verifica el tamaño máximo de archivo (5MB por defecto)

## 💰 Costos

- **Servicio Next.js:** ~$0.01-0.05/hora (depende del uso)
- **Servicio JSON Server:** ~$0.01-0.05/hora
- **Total:** ~$7-15/mes (con el crédito gratis de $5)

## ✅ Checklist

- [ ] Servidor JSON desplegado en Railway
- [ ] URL del servidor JSON guardada
- [ ] Variable `JSON_SERVER_URL` configurada en Next.js
- [ ] Servicios conectados en Railway
- [ ] API Routes creadas en Next.js
- [ ] Probar conexión entre servicios
- [ ] Probar subida de fotos
- [ ] Verificar que los datos persisten

