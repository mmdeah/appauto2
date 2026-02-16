# 🚗 Sistema de Gestión de Taller Mecánico

Sistema completo de gestión para talleres mecánicos con roles de administrador, técnico, control de calidad y cliente.

## ✨ Características

- 👥 **Gestión de usuarios** (Admin, Técnico, Control de Calidad)
- 🚙 **Gestión de clientes y vehículos**
- 📋 **Órdenes de servicio** con seguimiento de estados
- 📸 **Fotos de ingreso y servicio**
- 💰 **Gestión de gastos e ingresos**
- 📊 **Dashboard con estadísticas**
- 📄 **Generación de facturas PDF**
- 📱 **Portal público para clientes** (sin necesidad de cuenta)
- 🔔 **Notificaciones por WhatsApp**

## 🛠️ Tecnologías

- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **localStorage** - Almacenamiento local (actual)
- **JSON Server** - Base de datos JSON (para VPS)

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- pnpm (gestor de paquetes)

## 🚀 Instalación

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
app/
├── app/              # Páginas Next.js (App Router)
├── components/        # Componentes React
├── lib/              # Utilidades y lógica
│   ├── db.ts         # Funciones de base de datos
│   ├── storage.ts    # Almacenamiento local
│   └── types.ts      # Tipos TypeScript
├── server/           # Servidor JSON (para VPS)
└── public/           # Archivos estáticos
```

## 🔐 Credenciales por Defecto

### Administrador
- Email: `admin@taller.com`
- Password: `admin123`

### Técnico
- Email: `tecnico@taller.com`
- Password: `tecnico123`

### Control de Calidad
- Email: `calidad@taller.com`
- Password: `calidad123`

## 🌐 Despliegue

### Opción 1: VPS con JSON Server

1. Configurar servidor JSON en `/server`
2. Modificar `lib/db.ts` para usar API
3. Desplegar en VPS con PM2

Ver documentación en `/docs` para más detalles.

### Opción 2: Vercel + Supabase

1. Configurar proyecto en Supabase
2. Ejecutar scripts SQL en Supabase
3. Configurar variables de entorno
4. Desplegar en Vercel

## 📚 Documentación

- [Requisitos Locales](./docs/REQUISITOS_LOCAL.md)
- [Guía de Túneles](./docs/GUIA_TUNELS.md)
- [Documentación Base de Datos](./docs/DOCUMENTACION_BASE_DATOS.md)

## 📝 Notas

- Actualmente usa **localStorage** para almacenamiento local
- Para producción, se recomienda migrar a base de datos (Supabase o JSON Server)
- Las fotos se guardan en Base64 (localStorage) o como archivos (JSON Server)

## 📄 Licencia

Este proyecto es privado.

