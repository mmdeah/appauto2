# 🗄️ Base de Datos en Railway

Railway permite agregar bases de datos directamente como servicios. Tienes dos opciones:

## Opción 1: PostgreSQL en Railway (Recomendado) ⭐

PostgreSQL es una base de datos SQL robusta y profesional.

### Ventajas:
- ✅ Base de datos real y robusta
- ✅ Gratis en Railway (plan básico)
- ✅ Se conecta automáticamente
- ✅ Backups automáticos
- ✅ Escalable

### Pasos:

1. **En Railway Dashboard:**
   - Ve a tu proyecto
   - Click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway creará automáticamente un servicio PostgreSQL

2. **Obtener credenciales:**
   - Railway crea variables de entorno automáticamente:
     - `DATABASE_URL` - URL de conexión completa
     - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

3. **Conectar tu app:**
   - Las variables ya están disponibles en tu servicio Next.js
   - Solo necesitas instalar el cliente de PostgreSQL

## Opción 2: Servidor JSON en Railway

Un servidor JSON simple que guarda datos en archivos.

### Ventajas:
- ✅ Muy simple
- ✅ No requiere configuración de base de datos
- ✅ Fácil de entender

### Desventajas:
- ⚠️ Menos robusto que PostgreSQL
- ⚠️ Puede ser más lento con muchos datos

### Pasos:

1. **Crear servicio JSON Server:**
   - En Railway: **"+ New"** → **"Empty Service"**
   - Conecta el mismo repositorio de GitHub
   - Configura para ejecutar el servidor JSON

2. **Configurar variables:**
   - Agrega `JSON_SERVER_URL` en tu servicio Next.js
   - Apunta a la URL interna del servicio JSON

