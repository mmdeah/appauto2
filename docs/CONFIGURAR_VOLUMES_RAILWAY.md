# 📦 Configurar Volumes en Railway para Persistencia de Datos

Esta guía explica cómo configurar Volumes en Railway para que los datos (`db.json` y fotos) persistan entre despliegues.

## 🎯 ¿Por qué usar Volumes?

Sin Volumes, cada vez que Railway despliega tu servicio:
- Se crea un nuevo contenedor
- Se pierden todos los datos (órdenes, clientes, vehículos, fotos)
- `db.json` se reinicia vacío

Con Volumes:
- ✅ Los datos persisten entre despliegues
- ✅ Las fotos se mantienen
- ✅ No pierdes información al actualizar el código

## ⚠️ Requisitos

- **Plan de pago en Railway** (Volumes no está disponible en el plan gratuito)
- Costo aproximado: ~$0.10-0.20/GB/mes

## 🚀 Pasos para Configurar

### Paso 1: Crear el Volumen en Railway

1. **En Railway Dashboard:**
   - Ve a tu proyecto
   - Selecciona el servicio **JSON Server**
   - Ve a la pestaña **"Volumes"**
   - Click en **"+ New Volume"**
   - Configura:
     - **Nombre:** `json-server-data`
     - **Tamaño:** 1 GB (o el que necesites)
   - Click en **"Create"**

2. **Montar el Volumen:**
   - Después de crear el volumen, verás un botón **"Mount"**
   - Click en **"Mount"**
   - **Ruta de montaje:** `/app/data`
   - Click en **"Mount Volume"**

### Paso 2: Configurar Variable de Entorno

1. **En el servicio JSON Server:**
   - Ve a **"Variables"**
   - Click en **"+ New Variable"**
   - Agrega:
     ```
     DATA_DIR=/app/data
     ```
   - Click en **"Add"**

### Paso 3: Verificar el Código

El código ya está configurado para usar `DATA_DIR`:

```javascript
// server/server.js
const DATA_DIR = process.env.DATA_DIR || __dirname;
const dbPath = path.join(DATA_DIR, 'db.json');
```

Esto significa:
- Si `DATA_DIR` está configurado (Railway), usa `/app/data`
- Si no está configurado (local), usa `__dirname` (carpeta actual)

### Paso 4: Desplegar

1. **Haz commit y push de los cambios:**
   ```bash
   git add server/server.js
   git commit -m "feat: Configurar para usar Volumes en Railway"
   git push
   ```

2. **Railway desplegará automáticamente**

3. **Verifica los logs:**
   - Ve a tu servicio JSON Server en Railway
   - Click en **"Logs"**
   - Deberías ver:
     ```
     ✅ Directorio de datos: /app/data
     ✅ db.json creado con estructura inicial
     ✅ Carpeta de fotos creada
     ```

## 📁 Estructura de Archivos en el Volumen

Con el volumen montado en `/app/data`, la estructura será:

```
/app/data/
├── db.json              # Base de datos
└── photos/
    └── orders/
        ├── [orderId]/
        │   ├── intake/
        │   └── service/
```

## 🔍 Verificar que Funciona

1. **Crea una orden de servicio en la app**
2. **Sube algunas fotos**
3. **Haz un cambio en el código y haz push**
4. **Railway desplegará de nuevo**
5. **Verifica que la orden y las fotos siguen ahí** ✅

## 💾 Backup Manual

Aunque los datos persisten, es recomendable hacer backups periódicos:

1. **Conecta al servicio JSON Server:**
   - Railway → Tu servicio → "Connect" o "Shell"

2. **Descarga db.json:**
   ```bash
   # El archivo está en /app/data/db.json
   ```

3. **O usa Railway CLI:**
   ```bash
   railway volumes download json-server-data
   ```

## 🐛 Solución de Problemas

### El volumen no se monta
- Verifica que el volumen esté creado y montado
- Verifica que la ruta de montaje sea `/app/data`
- Revisa los logs del servicio

### Los datos no persisten
- Verifica que `DATA_DIR=/app/data` esté en las variables de entorno
- Verifica los logs para ver qué ruta está usando
- Asegúrate de que el volumen esté montado correctamente

### Error de permisos
- Railway maneja los permisos automáticamente
- Si hay problemas, verifica los logs

## 📊 Monitoreo del Volumen

En Railway Dashboard:
- Ve a **"Volumes"** en tu servicio
- Verás el uso del volumen (cuánto espacio está ocupando)
- Puedes aumentar el tamaño si es necesario

## ✅ Checklist

- [ ] Volumen creado en Railway
- [ ] Volumen montado en `/app/data`
- [ ] Variable `DATA_DIR=/app/data` configurada
- [ ] Código actualizado (ya está hecho)
- [ ] Desplegado y funcionando
- [ ] Verificado que los datos persisten después de un deploy

## 💡 Notas Importantes

1. **El volumen solo se puede montar en un servicio a la vez**
   - Si escalas horizontalmente, cada instancia necesitaría su propio volumen
   - Para escalar, considera migrar a PostgreSQL

2. **Backups son tu responsabilidad**
   - Railway no hace backups automáticos de Volumes
   - Haz backups periódicos manualmente

3. **Costo**
   - Volumes tienen costo adicional (~$0.10-0.20/GB/mes)
   - Para 1-5 GB: ~$0.50-1.00/mes

4. **Alternativa gratuita**
   - PostgreSQL en Railway es gratis
   - Tiene backups automáticos
   - Más robusto y escalable

