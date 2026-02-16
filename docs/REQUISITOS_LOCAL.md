# Requisitos para Ejecutar la Aplicación en Local

## Análisis de la Aplicación

Esta es una aplicación **Next.js 16** con **React 19** que utiliza **Supabase** como backend (base de datos y autenticación). Es un sistema de gestión de talleres mecánicos con roles de administrador, técnico y cliente.

---

## 🚀 Inicio Rápido: Solo para Desarrollo de Funciones (Sin Base de Datos)

Si solo quieres abrir la aplicación para crear funciones **sin tocar la base de datos**, puedes hacerlo de forma simplificada:

### Opción 1: Desarrollo Solo en Cliente (Recomendado)

La aplicación tiene un sistema de fallback que usa **localStorage** cuando se ejecuta en el navegador. Para trabajar sin Supabase:

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Crear archivo `.env.local` con valores dummy** (para evitar errores):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key_12345
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   pnpm dev
   ```

4. **Importante**: 
   - Trabaja solo en componentes del **cliente** (que usan `'use client'`)
   - Las funciones en `lib/db.ts` usarán automáticamente `localStorage` cuando se ejecuten en el navegador
   - Los datos se guardarán en el localStorage del navegador
   - **No funcionarán las funciones que se ejecuten en el servidor** (Server Components)

### Limitaciones al trabajar sin base de datos:

- ✅ Funciona: Componentes del cliente, formularios, UI
- ✅ Funciona: Funciones que usan `storage.ts` (localStorage)
- ❌ No funciona: Server Components que llaman a Supabase
- ❌ No funciona: Autenticación real (pero puedes simularla)
- ❌ No funciona: Almacenamiento de fotos en Supabase Storage

### Nota sobre Server Components

Si necesitas probar funciones que se ejecutan en el servidor, tendrás que configurar Supabase o modificar temporalmente el código para forzar el uso de localStorage.

---

## Configuración Completa (Con Base de Datos)

## Requisitos Previos

### 1. Node.js y pnpm
- **Node.js**: Versión 18 o superior (recomendado 20+)
- **pnpm**: Gestor de paquetes (ya está configurado con `pnpm-lock.yaml`)

Para instalar pnpm si no lo tienes:
```bash
npm install -g pnpm
```

### 2. Cuenta y Proyecto en Supabase

La aplicación requiere una conexión a Supabase. Necesitas:

1. Crear una cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener las credenciales del proyecto:
   - **URL del proyecto** (ejemplo: `https://xxxxx.supabase.co`)
   - **Anon Key** (clave pública anónima)

## Configuración de Variables de Entorno

### Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Ubicación de las credenciales en Supabase:**
- Ve a tu proyecto en Supabase
- Ve a **Settings** → **API**
- Copia:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Configuración de la Base de Datos

### Ejecutar Scripts SQL

La aplicación incluye scripts SQL en la carpeta `scripts/` que debes ejecutar en tu base de datos de Supabase:

1. **001_create_tables.sql**: Crea todas las tablas necesarias
2. **002_insert_demo_data.sql**: Inserta datos de demostración (opcional)
3. **003_add_expenses_and_revenues_tables.sql**: Crea tablas de gastos e ingresos
4. **004_create_reports_table.sql**: Crea tabla de reportes

**Cómo ejecutarlos:**
1. Ve a tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Ejecuta cada script en orden (001, 002, 003, 004)
4. Verifica que todas las tablas se hayan creado correctamente

## Instalación y Ejecución

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Ejecutar en Modo Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en: `http://localhost:3000`

### 3. Build para Producción

```bash
pnpm build
pnpm start
```

## Estructura de la Aplicación

- **`/app`**: Páginas y rutas de Next.js App Router
  - `/admin`: Panel de administración
  - `/client`: Portal de clientes
  - `/technician`: Panel de técnicos
  - `/dashboard`: Dashboard principal
- **`/components`**: Componentes reutilizables
- **`/lib`**: Utilidades y configuración
  - `supabase/`: Clientes de Supabase (cliente, servidor, middleware)
  - `db.ts`: Funciones de acceso a datos
  - `storage.ts`: Almacenamiento local (fallback)
- **`/scripts`**: Scripts SQL para la base de datos
- **`/public`**: Archivos estáticos

## Características Principales

- ✅ Autenticación con Supabase Auth
- ✅ Gestión de usuarios (admin, técnico)
- ✅ Gestión de clientes (sin cuenta)
- ✅ Gestión de vehículos
- ✅ Órdenes de servicio con estados
- ✅ Historial de estados
- ✅ Gestión de gastos e ingresos
- ✅ Reportes técnicos
- ✅ Generación de PDFs (facturas)
- ✅ Almacenamiento de fotos en Supabase Storage

## Notas Importantes

1. **Middleware**: El middleware actual está deshabilitado (`middleware.ts` retorna sin hacer nada). Existe una función `updateSession` en `lib/supabase/middleware.ts` que maneja la autenticación, pero no está siendo utilizada. Si necesitas autenticación en rutas protegidas, deberás habilitar el middleware importando y llamando a `updateSession`.

2. **Almacenamiento de Fotos**: La aplicación usa Supabase Storage con un bucket llamado `workshop-photos`. Asegúrate de que este bucket exista y tenga las políticas correctas (ver script SQL).

3. **Row Level Security (RLS)**: Las tablas tienen RLS habilitado. Las políticas permiten:
   - Lectura pública para clientes (sin autenticación)
   - Escritura solo para administradores autenticados

4. **Variables de Entorno**: Las variables deben comenzar con `NEXT_PUBLIC_` para estar disponibles en el cliente.

## Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que las variables tienen el prefijo `NEXT_PUBLIC_`
- Reinicia el servidor de desarrollo después de crear/modificar `.env.local`

### Error de conexión a Supabase
- Verifica que las credenciales en `.env.local` son correctas
- Verifica que tu proyecto de Supabase está activo
- Revisa la consola del navegador para más detalles

### Error al crear tablas
- Ejecuta los scripts SQL en orden
- Verifica que tienes permisos de administrador en Supabase
- Revisa los logs en Supabase SQL Editor

## Comandos Disponibles

```bash
pnpm dev      # Desarrollo
pnpm build    # Build de producción
pnpm start    # Servidor de producción
pnpm lint     # Linter
```

