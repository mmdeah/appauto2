# 🚂 Guía de Despliegue en Railway

Railway es una plataforma de hosting que permite desplegar aplicaciones Next.js fácilmente.

## 📋 Requisitos Previos

1. **Cuenta en Railway**: https://railway.app
2. **Repositorio en GitHub**: Tu código ya está en GitHub ✅
3. **Base de datos**: Necesitas decidir entre:
   - **Supabase** (recomendado - gratis)
   - **Servidor JSON** (si prefieres todo local)

## 🚀 Pasos para Desplegar

### Paso 1: Crear Proyecto en Railway

1. Ve a https://railway.app
2. Inicia sesión con GitHub
3. Click en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Elige tu repositorio: `mmdeah/appauto2`
6. Railway detectará automáticamente que es Next.js

### Paso 2: Configurar Variables de Entorno

En el dashboard de Railway:

1. Ve a tu proyecto
2. Click en **"Variables"** (o **"Settings" → "Variables"**)
3. Agrega las siguientes variables:

#### Si usas Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

#### Si usas Servidor JSON (necesitarás otro servicio):
```
JSON_SERVER_URL=http://json-server-service:3001
```

### Paso 3: Configurar Base de Datos

#### Opción A: Usar Supabase (Recomendado)

1. Crea cuenta en https://supabase.com
2. Crea un nuevo proyecto
3. Ejecuta los scripts SQL de `scripts/` en Supabase SQL Editor
4. Obtén las credenciales y agrégalas a Railway

#### Opción B: Usar Servidor JSON en Railway

1. Crea un **nuevo servicio** en Railway
2. Configura para ejecutar el servidor JSON
3. Usa la URL interna del servicio como `JSON_SERVER_URL`

### Paso 4: Desplegar

Railway desplegará automáticamente cuando:
- Haces push a GitHub
- O puedes hacerlo manualmente desde el dashboard

### Paso 5: Obtener URL

1. En el dashboard de Railway, verás la URL de tu app
2. Algo como: `https://tu-app.up.railway.app`
3. Railway asigna una URL automáticamente
4. Puedes configurar un dominio personalizado si quieres

## 🔧 Configuración Avanzada

### Usar pnpm en Railway

Railway detecta automáticamente `pnpm-lock.yaml` y usa pnpm.

### Puerto

Railway configura automáticamente el puerto. Next.js lo detecta con `process.env.PORT`.

### Build y Start

Railway ejecuta automáticamente:
- `pnpm install`
- `pnpm build`
- `pnpm start`

## ⚠️ Consideraciones Importantes

### 1. localStorage NO funcionará en producción

Tu app actual usa `localStorage` que solo funciona en el navegador. En Railway necesitas:

- **Opción 1**: Migrar a Supabase (recomendado)
- **Opción 2**: Configurar servidor JSON como servicio separado

### 2. Fotos

Si usas Base64 en localStorage, no funcionará bien. Necesitas:
- **Supabase Storage** (si usas Supabase)
- **Servidor de archivos** (si usas JSON Server)

### 3. Variables de Entorno

Asegúrate de que todas las variables que empiezan con `NEXT_PUBLIC_` estén configuradas en Railway.

## 📊 Monitoreo

Railway proporciona:
- Logs en tiempo real
- Métricas de uso
- Alertas de errores

## 💰 Costos

Railway tiene un plan gratuito con:
- $5 de crédito gratis al mes
- Suficiente para proyectos pequeños
- Pago por uso después del crédito

## 🔄 Actualizaciones

Cada vez que hagas push a GitHub, Railway desplegará automáticamente la nueva versión.

## 🐛 Solución de Problemas

### Build falla
- Revisa los logs en Railway
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `pnpm-lock.yaml` esté en el repo

### App no inicia
- Verifica las variables de entorno
- Revisa los logs de inicio
- Asegúrate de que el puerto esté configurado correctamente

### Errores de base de datos
- Verifica las credenciales de Supabase
- Asegúrate de que las tablas estén creadas
- Revisa las políticas de RLS en Supabase

## 📚 Recursos

- [Documentación de Railway](https://docs.railway.app)
- [Guía de Next.js en Railway](https://docs.railway.app/guides/nextjs)

