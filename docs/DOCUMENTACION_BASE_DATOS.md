# Documentación: Sistema de Base de Datos Actual

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnología Utilizada](#tecnología-utilizada)
4. [Estructura de Datos](#estructura-de-datos)
5. [Sistema de Almacenamiento](#sistema-de-almacenamiento)
6. [Capas de Abstracción](#capas-de-abstracción)
7. [Operaciones CRUD](#operaciones-crud)
8. [Flujo de Datos](#flujo-de-datos)
9. [Ejemplos de Uso](#ejemplos-de-uso)
10. [Limitaciones y Consideraciones](#limitaciones-y-consideraciones)
11. [Migración a Base de Datos Real](#migración-a-base-de-datos-real)

---

## Resumen Ejecutivo

La aplicación utiliza **localStorage del navegador** como sistema de persistencia de datos. No existe una base de datos tradicional (SQL, NoSQL, etc.), sino que todos los datos se almacenan localmente en el navegador del usuario en formato JSON.

### Características Principales

- ✅ **Almacenamiento Local**: Todos los datos se guardan en el navegador del usuario
- ✅ **Formato JSON**: Los datos se serializan/deserializan como JSON
- ✅ **Solo Cliente**: Funciona exclusivamente en componentes del cliente (Client Components)
- ✅ **Sin Servidor**: No requiere servidor de base de datos
- ✅ **Persistencia de Sesión**: Los datos persisten entre recargas de página
- ❌ **No Compartido**: Cada usuario tiene sus propios datos
- ❌ **Limitado por Espacio**: Restricción de ~5-10 MB por dominio
- ❌ **No Escalable**: No funciona para múltiples usuarios simultáneos

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Componentes React                        │
│              (Client Components - 'use client')              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Importa funciones async
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    lib/db.ts                                │
│         (Capa de Abstracción - Funciones Async)             │
│  - getUsers()                                               │
│  - getClients()                                             │
│  - getServiceOrders()                                        │
│  - saveServiceOrder()                                        │
│  - etc...                                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Llama funciones síncronas
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  lib/storage.ts                             │
│        (Capa de Acceso Directo - Funciones Síncronas)       │
│  - getFromStorage<T>(key)                                   │
│  - saveToStorage<T>(key, data)                              │
│  - Funciones específicas por entidad                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Accede directamente
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              localStorage                               │
│  Claves:                                                      │
│  - workshop_users                                            │
│  - workshop_clients                                          │
│  - workshop_vehicles                                         │
│  - workshop_service_orders                                   │
│  - workshop_state_history                                    │
│  - workshop_revenues                                         │
│  - workshop_expenses                                         │
│  - workshop_reports                                          │
│  - workshop_current_user                                    │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Componente React** → Llama función de `lib/db.ts` (async)
2. **lib/db.ts** → Llama función de `lib/storage.ts` (sync)
3. **lib/storage.ts** → Lee/Escribe en `localStorage`
4. **localStorage** → Almacena como string JSON
5. **Respuesta** → Se devuelve al componente (async)

---

## Tecnología Utilizada

### localStorage API

**localStorage** es una API del navegador que permite almacenar datos de forma persistente en el cliente. Es parte de la Web Storage API.

#### Características Técnicas

- **Tipo**: Clave-Valor (Key-Value Store)
- **Formato**: Solo strings
- **Persistencia**: Permanente hasta que se elimine manualmente
- **Límite**: ~5-10 MB por dominio (depende del navegador)
- **Alcance**: Por dominio y protocolo
- **Sincronización**: Síncrona (bloquea el hilo principal)

#### Métodos Utilizados

```javascript
// Leer datos
localStorage.getItem(key) // Retorna string | null

// Guardar datos
localStorage.setItem(key, value) // key y value deben ser strings

// Eliminar datos
localStorage.removeItem(key)

// Limpiar todo
localStorage.clear()
```

---

## Estructura de Datos

### Entidades Principales

La aplicación maneja las siguientes entidades principales, definidas en `lib/types.ts`:

#### 1. User (Usuario del Sistema)

```typescript
interface User {
  id: string                    // Identificador único
  email: string                 // Email (usado para login)
  password: string              // Contraseña (sin hash - solo desarrollo)
  name: string                 // Nombre completo
  role: UserRole               // 'admin' | 'client' | 'technician'
  createdAt: string            // Fecha de creación (ISO 8601)
}
```

**Almacenamiento**: `workshop_users` (array de User)

#### 2. Client (Cliente - Sin Cuenta)

```typescript
interface Client {
  id: string                    // Identificador único
  name: string                  // Nombre completo
  idNumber: string              // Cédula/ID
  phone: string                 // Teléfono
  email: string                 // Email
  address?: string              // Dirección (opcional)
  createdAt: string             // Fecha de creación
  updatedAt: string             // Fecha de última actualización
}
```

**Almacenamiento**: `workshop_clients` (array de Client)

#### 3. Vehicle (Vehículo)

```typescript
interface Vehicle {
  id: string                    // Identificador único
  clientId: string              // ID del cliente propietario
  brand: string                 // Marca (ej: Toyota)
  model: string                 // Modelo (ej: Corolla)
  year: number                  // Año
  licensePlate: string          // Placa
  vin?: string                  // VIN (opcional)
  color?: string                // Color (opcional)
}
```

**Almacenamiento**: `workshop_vehicles` (array de Vehicle)

#### 4. ServiceOrder (Orden de Servicio)

```typescript
interface ServiceOrder {
  id: string                    // Identificador único
  orderNumber?: string          // Número de orden legible (ej: SD1231)
  vehicleId: string             // ID del vehículo
  clientId: string              // ID del cliente
  technicianId?: string         // ID del técnico asignado
  state: ServiceState           // Estado actual
  description: string           // Descripción del problema
  services: ServiceItem[]        // Servicios programados
  quotation?: Quotation         // Cotización (opcional)
  diagnosis?: string             // Diagnóstico
  estimatedCost?: number        // Costo estimado
  finalCost?: number            // Costo final
  intakePhotos: string[]        // Fotos de ingreso (Base64)
  servicePhotos: string[]       // Fotos del trabajo (Base64)
  createdAt: string              // Fecha de creación
  updatedAt: string             // Fecha de actualización
  completedAt?: string          // Fecha de completado
  deliveredAt?: string          // Fecha de entrega
}
```

**Estados Posibles** (`ServiceState`):
- `"reception"` - Recepción del vehículo
- `"quotation"` - Cotización en progreso
- `"process"` - En proceso de reparación
- `"quality"` - Control de calidad

**Almacenamiento**: `workshop_service_orders` (array de ServiceOrder)

#### 5. ServiceItem (Servicio Individual)

```typescript
interface ServiceItem {
  id: string                    // Identificador único
  description: string           // Descripción del servicio
  completed: boolean             // Si está completado
  completedAt?: string           // Fecha de completado
  completedBy?: string           // ID del técnico que lo completó
}
```

**Almacenamiento**: Parte de `ServiceOrder.services[]`

#### 6. Quotation (Cotización)

```typescript
interface Quotation {
  id: string                    // Identificador único
  items: QuotationItem[]        // Items de la cotización
  subtotal: number              // Subtotal
  tax: number                   // Impuestos
  total: number                 // Total
  includesTax: boolean          // Si incluye impuestos
  createdAt: string             // Fecha de creación
  createdBy: string             // ID del usuario que la creó
}
```

**Almacenamiento**: Parte de `ServiceOrder.quotation`

#### 7. StateHistory (Historial de Estados)

```typescript
interface StateHistory {
  id: string                    // Identificador único
  serviceOrderId: string        // ID de la orden de servicio
  previousState: ServiceState   // Estado anterior
  newState: ServiceState        // Estado nuevo
  changedBy: string             // ID del usuario que hizo el cambio
  changedAt: string             // Fecha del cambio
  notes?: string                // Notas adicionales
}
```

**Almacenamiento**: `workshop_state_history` (array de StateHistory)

#### 8. Expense (Gasto)

```typescript
interface Expense {
  id: string                    // Identificador único
  description: string                // Descripción del gasto
  amount: number                 // Monto
  category: string               // Categoría
  date: string                   // Fecha del gasto
  created_at: string             // Fecha de creación
}
```

**Almacenamiento**: `workshop_expenses` (array de Expense)

#### 9. Revenue (Ingreso)

```typescript
interface Revenue {
  id: string                    // Identificador único
  serviceOrderId: string        // ID de la orden relacionada
  amount: number                 // Monto
  date: string                   // Fecha del ingreso
  description: string            // Descripción
  created_at: string             // Fecha de creación
}
```

**Almacenamiento**: `workshop_revenues` (array de Revenue)

#### 10. Report (Reporte Técnico)

```typescript
interface Report {
  id: string                    // Identificador único
  licensePlate: string          // Placa del vehículo
  category: string              // Categoría del reporte
  text: string                   // Texto del reporte
  createdAt: string              // Fecha de creación
  resolved?: boolean             // Si está resuelto
}
```

**Almacenamiento**: `workshop_reports` (array de Report)

---

## Sistema de Almacenamiento

### Claves de localStorage

Todas las claves están definidas en `lib/storage.ts`:

```typescript
const KEYS = {
  USERS: 'workshop_users',                    // Usuarios del sistema
  CLIENTS: 'workshop_clients',                 // Clientes
  VEHICLES: 'workshop_vehicles',               // Vehículos
  SERVICE_ORDERS: 'workshop_service_orders',   // Órdenes de servicio
  STATE_HISTORY: 'workshop_state_history',     // Historial de estados
  CURRENT_USER: 'workshop_current_user',       // Usuario actual (sesión)
  REVENUES: 'workshop_revenues',               // Ingresos
  EXPENSES: 'workshop_expenses',               // Gastos
  REPORTS: 'workshop_reports',                 // Reportes técnicos
} as const;
```

### Funciones Genéricas

#### `getFromStorage<T>(key: string): T[]`

Lee datos de localStorage y los parsea como JSON.

```typescript
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];  // SSR check
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}
```

**Características**:
- Retorna array vacío si no hay datos
- Retorna array vacío en servidor (SSR)
- Parsea JSON automáticamente

#### `saveToStorage<T>(key: string, data: T[]): void`

Guarda datos en localStorage como JSON.

```typescript
function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;  // SSR check
  localStorage.setItem(key, JSON.stringify(data));
}
```

**Características**:
- Serializa a JSON automáticamente
- No hace nada en servidor (SSR)
- Reemplaza completamente los datos existentes

### Patrón de Guardado

Todas las funciones de guardado siguen el mismo patrón:

1. **Obtener** todos los datos existentes
2. **Buscar** si el item ya existe (por ID)
3. **Actualizar** si existe, **Agregar** si no existe
4. **Guardar** el array completo

**Ejemplo** (`saveServiceOrder`):

```typescript
export function saveServiceOrder(order: ServiceOrder): void {
  const orders = getServiceOrders();                    // 1. Obtener todos
  const existingIndex = orders.findIndex(o => o.id === order.id);  // 2. Buscar
  
  if (existingIndex >= 0) {
    orders[existingIndex] = order;                     // 3a. Actualizar
  } else {
    orders.push(order);                                // 3b. Agregar
  }
  
  saveToStorage(KEYS.SERVICE_ORDERS, orders);          // 4. Guardar
}
```

---

## Capas de Abstracción

### Capa 1: `lib/storage.ts` (Acceso Directo)

**Propósito**: Funciones síncronas que acceden directamente a localStorage.

**Características**:
- Funciones síncronas
- Acceso directo a localStorage
- No manejan errores
- No generan IDs automáticamente

**Ejemplo**:
```typescript
export function getServiceOrders(): ServiceOrder[] {
  return getFromStorage<ServiceOrder>(KEYS.SERVICE_ORDERS);
}

export function saveServiceOrder(order: ServiceOrder): void {
  const orders = getServiceOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  saveToStorage(KEYS.SERVICE_ORDERS, orders);
}
```

### Capa 2: `lib/db.ts` (Abstracción Async)

**Propósito**: Funciones async que envuelven las funciones de storage para compatibilidad con componentes React.

**Características**:
- Funciones async (retornan Promise)
- Envuelven funciones de storage
- Compatibles con React hooks
- Mismo API que tendría una base de datos real

**Ejemplo**:
```typescript
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return Promise.resolve(storageGetServiceOrders());
}

export async function saveServiceOrder(order: Partial<ServiceOrder>): Promise<ServiceOrder> {
  return Promise.resolve(storageSaveServiceOrder(order));
}
```

**Ventaja**: Facilita la migración futura a una base de datos real, solo cambiando la implementación interna.

---

## Operaciones CRUD

### Create (Crear)

#### Usuarios

```typescript
// Desde storage.ts
const newUser: User = {
  id: generateId(),
  email: 'nuevo@email.com',
  password: 'password123',
  name: 'Nuevo Usuario',
  role: 'technician',
  createdAt: new Date().toISOString()
};
saveUser(newUser);

// Desde db.ts (async)
await saveUser(newUser);
```

#### Clientes

```typescript
// Desde storage.ts
const newClient: Client = {
  id: generateId(),
  name: 'Juan Pérez',
  idNumber: '1234567890',
  phone: '3001234567',
  email: 'juan@email.com',
  address: 'Calle 123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
saveClient(newClient);

// Desde db.ts (async)
await saveClient(newClient);
```

#### Órdenes de Servicio

```typescript
// Desde storage.ts
const newOrder: ServiceOrder = {
  id: generateId(),
  orderNumber: 'SD1231',
  vehicleId: 'vehicle-id',
  clientId: 'client-id',
  state: 'reception',
  description: 'Revisión general',
  services: [],
  intakePhotos: [],
  servicePhotos: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
saveServiceOrder(newOrder);

// Desde db.ts (async)
await saveServiceOrder(newOrder);
```

### Read (Leer)

#### Obtener Todos

```typescript
// Desde storage.ts (síncrono)
const allOrders = getServiceOrders();
const allClients = getClients();
const allVehicles = getVehicles();

// Desde db.ts (async)
const allOrders = await getServiceOrders();
const allClients = await getClients();
const allVehicles = await getVehicles();
```

#### Obtener por ID

```typescript
// Desde storage.ts
const order = getServiceOrderById('order-id');
const client = getClientById('client-id');
const vehicle = getVehicleByLicensePlate('ABC123');

// Desde db.ts (async)
const order = await getServiceOrderById('order-id');
const client = await getClientById('client-id');
const vehicle = await getVehicleByLicensePlate('ABC123');
```

#### Obtener con Filtros

```typescript
// Desde storage.ts
const clientOrders = getServiceOrdersByClientId('client-id');
const technicianOrders = getServiceOrdersByTechnicianId('technician-id');
const vehicleOrders = getServiceOrdersByVehicleId('vehicle-id');
const clientVehicles = getVehiclesByClientId('client-id');

// Desde db.ts (async)
const clientOrders = await getServiceOrdersByClientId('client-id');
const technicianOrders = await getServiceOrdersByTechnicianId('technician-id');
const vehicleOrders = await getServiceOrdersByVehicleId('vehicle-id');
const clientVehicles = await getVehiclesByClientId('client-id');
```

### Update (Actualizar)

#### Actualizar Orden de Servicio

```typescript
// Desde storage.ts
const order = getServiceOrderById('order-id');
if (order) {
  order.state = 'process';
  order.updatedAt = new Date().toISOString();
  saveServiceOrder(order);
}

// Desde db.ts (async)
await updateServiceOrder('order-id', {
  state: 'process',
  updatedAt: new Date().toISOString()
});
```

#### Actualizar Reporte

```typescript
// Desde storage.ts
updateReport('report-id', { resolved: true });

// Desde db.ts (async)
await updateReport('report-id', { resolved: true });
```

### Delete (Eliminar)

#### Eliminar Orden de Servicio

```typescript
// Desde storage.ts
deleteServiceOrder('order-id');  // También elimina historial relacionado

// Desde db.ts (async)
await deleteServiceOrder('order-id');
```

#### Eliminar Gasto

```typescript
// Desde storage.ts
deleteExpense('expense-id');

// Desde db.ts (async)
await deleteExpense('expense-id');
```

---

## Flujo de Datos

### Ejemplo Completo: Crear una Orden de Servicio

```
1. Usuario llena formulario en React Component
   ↓
2. Componente llama: await saveServiceOrder(newOrder)
   ↓
3. lib/db.ts: Promise.resolve(storageSaveServiceOrder(order))
   ↓
4. lib/storage.ts: saveServiceOrder(order)
   ↓
5. Obtiene todas las órdenes: getServiceOrders()
   ↓
6. getFromStorage('workshop_service_orders')
   ↓
7. localStorage.getItem('workshop_service_orders')
   ↓
8. JSON.parse(data) → Array de ServiceOrder[]
   ↓
9. Busca si existe: findIndex(o => o.id === order.id)
   ↓
10. Si existe: actualiza, Si no: agrega
   ↓
11. saveToStorage(KEYS.SERVICE_ORDERS, orders)
   ↓
12. JSON.stringify(orders) → string
   ↓
13. localStorage.setItem('workshop_service_orders', string)
   ↓
14. Datos guardados en navegador
```

### Ejemplo: Leer Órdenes de un Técnico

```
1. Componente llama: await getServiceOrdersByTechnicianId('tech-id')
   ↓
2. lib/db.ts: Promise.resolve(storageGetServiceOrdersByTechnicianId(id))
   ↓
3. lib/storage.ts: getServiceOrdersByTechnicianId(technicianId)
   ↓
4. getServiceOrders() → Todas las órdenes
   ↓
5. filter(o => o.technicianId === technicianId) → Filtrar
   ↓
6. Retornar array filtrado
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear Nueva Orden de Servicio

```typescript
'use client';

import { useState } from 'react';
import { saveServiceOrder } from '@/lib/db';
import type { ServiceOrder } from '@/lib/types';

export default function NewOrderForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newOrder: ServiceOrder = {
      id: Date.now().toString(),
      orderNumber: 'SD1231',
      vehicleId: 'vehicle-123',
      clientId: 'client-456',
      state: 'reception',
      description: 'Revisión general del vehículo',
      services: [],
      intakePhotos: [],
      servicePhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveServiceOrder(newOrder);
      alert('Orden creada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Crear Orden'}
      </button>
    </form>
  );
}
```

### Ejemplo 2: Listar Órdenes con Filtros

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getServiceOrders, getServiceOrdersByTechnicianId } from '@/lib/db';
import type { ServiceOrder } from '@/lib/types';

export default function OrdersList({ technicianId }: { technicianId?: string }) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [technicianId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = technicianId
        ? await getServiceOrdersByTechnicianId(technicianId)
        : await getServiceOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <h3>{order.orderNumber || order.id}</h3>
          <p>{order.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 3: Actualizar Estado de Orden

```typescript
'use client';

import { updateServiceOrder, createStateHistory } from '@/lib/db';
import type { ServiceState } from '@/lib/types';

export default function StateUpdater({ orderId, currentState }: { orderId: string, currentState: ServiceState }) {
  const handleStateChange = async (newState: ServiceState) => {
    try {
      // Actualizar orden
      await updateServiceOrder(orderId, {
        state: newState,
        updatedAt: new Date().toISOString()
      });

      // Crear historial
      await createStateHistory({
        serviceOrderId: orderId,
        previousState: currentState,
        newState: newState,
        changedBy: 'user-id',
        notes: `Estado: ${newState}`
      });

      alert('Estado actualizado');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado');
    }
  };

  return (
    <button onClick={() => handleStateChange('process')}>
      Cambiar a Proceso
    </button>
  );
}
```

### Ejemplo 4: Manejo de Fotos (Base64)

```typescript
'use client';

import { saveServiceOrderWithPhotos } from '@/lib/storage';
import type { ServiceOrder } from '@/lib/types';

export default function PhotoUploader({ order }: { order: ServiceOrder }) {
  const handlePhotoUpload = async (file: File) => {
    // Convertir File a Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Photo = reader.result as string;
      
      const updatedOrder: ServiceOrder = {
        ...order,
        intakePhotos: [...order.intakePhotos, base64Photo],
        updatedAt: new Date().toISOString()
      };

      await saveServiceOrderWithPhotos(updatedOrder);
    };
    reader.readAsDataURL(file);
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handlePhotoUpload(file);
      }}
    />
  );
}
```

---

## Limitaciones y Consideraciones

### Limitaciones Técnicas

#### 1. **Espacio Limitado**
- **Límite**: ~5-10 MB por dominio
- **Problema**: Fotos en Base64 ocupan mucho espacio
- **Solución**: Comprimir imágenes antes de guardar

#### 2. **Solo Cliente**
- **Limitación**: No funciona en Server Components
- **Problema**: No se puede usar en SSR/SSG
- **Solución**: Usar solo en Client Components ('use client')

#### 3. **Sincronización**
- **Limitación**: No hay sincronización entre pestañas
- **Problema**: Cambios en una pestaña no se reflejan en otra
- **Solución**: Escuchar evento `storage` de localStorage

#### 4. **Sin Transacciones**
- **Limitación**: No hay rollback si falla una operación
- **Problema**: Puede quedar en estado inconsistente
- **Solución**: Validar antes de guardar

#### 5. **Sin Índices**
- **Limitación**: Búsquedas son lineales (O(n))
- **Problema**: Lento con muchos datos
- **Solución**: Filtrar en memoria (solo funciona con pocos datos)

### Consideraciones de Seguridad

#### 1. **Datos Visibles**
- Todos los datos son visibles en DevTools
- No hay encriptación
- **Riesgo**: Información sensible expuesta

#### 2. **Contraseñas en Texto Plano**
- Las contraseñas se guardan sin hash
- **Riesgo**: Acceso no autorizado
- **Solución**: Hash antes de guardar (bcrypt, etc.)

#### 3. **Sin Autenticación Real**
- La sesión se guarda en localStorage
- Fácil de manipular
- **Riesgo**: Suplantación de identidad

### Consideraciones de Rendimiento

#### 1. **Operaciones Síncronas**
- localStorage bloquea el hilo principal
- Puede causar lag con muchos datos
- **Solución**: Usar Web Workers para operaciones pesadas

#### 2. **Serialización JSON**
- JSON.stringify/parse es costoso
- Se ejecuta en cada lectura/escritura
- **Solución**: Cachear datos en memoria

#### 3. **Fotos en Base64**
- Base64 aumenta el tamaño ~33%
- Muy pesado para muchas fotos
- **Solución**: Usar URLs o almacenamiento externo

---

## Migración a Base de Datos Real

### Preparación

La arquitectura actual facilita la migración porque:

1. **Capa de Abstracción**: `lib/db.ts` ya usa funciones async
2. **Tipos Definidos**: Todas las interfaces están en `lib/types.ts`
3. **API Consistente**: Mismo patrón de funciones

### Pasos para Migrar

#### 1. **Elegir Base de Datos**

Opciones recomendadas:
- **Supabase** (PostgreSQL) - Ya configurado en proyecto
- **Firebase** (Firestore)
- **MongoDB Atlas**
- **Vercel Postgres**

#### 2. **Modificar `lib/db.ts`**

Cambiar implementación interna sin cambiar la interfaz:

```typescript
// Antes (localStorage)
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return Promise.resolve(storageGetServiceOrders());
}

// Después (Supabase)
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*');
  if (error) throw error;
  return data || [];
}
```

#### 3. **Migrar Datos Existentes**

Script para exportar de localStorage e importar a BD:

```typescript
// Exportar de localStorage
const exportData = () => {
  const data = {
    users: getUsers(),
    clients: getClients(),
    vehicles: getVehicles(),
    serviceOrders: getServiceOrders(),
    // ... etc
  };
  return JSON.stringify(data, null, 2);
};

// Importar a Supabase
const importData = async (data: any) => {
  const supabase = await createClient();
  
  // Insertar usuarios
  await supabase.from('users').insert(data.users);
  
  // Insertar clientes
  await supabase.from('clients').insert(data.clients);
  
  // ... etc
};
```

#### 4. **Actualizar Componentes**

Los componentes **NO necesitan cambios** porque la interfaz de `lib/db.ts` se mantiene igual.

### Ventajas Post-Migración

✅ **Datos Compartidos**: Todos los usuarios ven los mismos datos
✅ **Escalabilidad**: Maneja millones de registros
✅ **Seguridad**: Autenticación y autorización real
✅ **Backup**: Datos respaldados automáticamente
✅ **Consultas Avanzadas**: SQL queries complejas
✅ **Índices**: Búsquedas rápidas
✅ **Transacciones**: Consistencia de datos garantizada

---

## Guía Completa: Migración a Supabase

Esta sección proporciona una guía paso a paso detallada para migrar el sistema actual de localStorage a Supabase (PostgreSQL).

### Prerrequisitos

- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Node.js y npm/pnpm instalados
- Proyecto Next.js configurado
- Datos existentes en localStorage (opcional, para migración)

### Paso 1: Crear Proyecto en Supabase

1. **Ir a Supabase Dashboard**
   - Visita [app.supabase.com](https://app.supabase.com)
   - Inicia sesión o crea una cuenta

2. **Crear Nuevo Proyecto**
   - Click en "New Project"
   - Completa el formulario:
     - **Name**: Nombre del proyecto (ej: "taller-mecanico")
     - **Database Password**: Contraseña segura (guárdala)
     - **Region**: Selecciona la región más cercana
     - **Pricing Plan**: Free tier es suficiente para empezar

3. **Esperar Configuración**
   - El proyecto tarda 1-2 minutos en configurarse
   - Una vez listo, verás el dashboard del proyecto

### Paso 2: Obtener Credenciales

1. **Ir a Settings → API**
   - En el menú lateral, ve a Settings → API

2. **Copiar Credenciales**
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Clave pública (segura para el cliente)
   - **service_role key**: Clave privada (NUNCA exponer en el cliente)

3. **Guardar Credenciales**
   - Las necesitarás para configurar las variables de entorno

### Paso 3: Configurar Variables de Entorno

1. **Crear Archivo `.env.local`**

   En la raíz del proyecto, crea o actualiza `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Verificar que no esté en Git**

   Asegúrate de que `.env.local` esté en `.gitignore`:

   ```
   .env.local
   .env*.local
   ```

3. **Reiniciar Servidor de Desarrollo**

   ```bash
   # Detener el servidor (Ctrl+C)
   # Reiniciar
   npm run dev
   # o
   pnpm dev
   ```

### Paso 4: Crear Tablas en Supabase

1. **Ir a SQL Editor**
   - En el dashboard de Supabase, ve a "SQL Editor" en el menú lateral

2. **Ejecutar Script SQL**
   - Abre el archivo `scripts/001_create_tables.sql`
   - Copia todo el contenido
   - Pega en el SQL Editor de Supabase
   - Click en "Run" o presiona `Ctrl+Enter`

3. **Verificar Tablas Creadas**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver las siguientes tablas:
     - `clients`
     - `users`
     - `vehicles`
     - `service_orders`
     - `state_history`
     - `expenses`
     - `revenues` (si existe en el script)
     - `reports` (si existe en el script)

4. **Verificar Storage Bucket**
   - Ve a "Storage" en el menú lateral
   - Deberías ver un bucket llamado `workshop-photos`
   - Si no existe, el script SQL lo crea automáticamente

### Paso 5: Adaptar `lib/db.ts` para Supabase

El proyecto ya tiene `lib/db-server.ts` con funciones de Supabase para Server Components. Ahora necesitamos adaptar `lib/db.ts` para usar Supabase en Client Components.

#### 5.1. Instalar Dependencias (si no están)

```bash
npm install @supabase/supabase-js @supabase/ssr
# o
pnpm add @supabase/supabase-js @supabase/ssr
```

#### 5.2. Modificar `lib/db.ts`

Reemplaza las funciones para usar Supabase en lugar de localStorage:

```typescript
// lib/db.ts
import { createClient } from '@/lib/supabase/client';
import type {
  User,
  Client,
  Vehicle,
  ServiceOrder,
  StateHistory,
  Expense,
  Revenue,
  Report,
} from './types';

// Helper para mapear nombres de columnas (snake_case → camelCase)
function mapServiceOrder(row: any): ServiceOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    vehicleId: row.vehicle_id,
    clientId: row.client_id,
    technicianId: row.technician_id,
    state: row.state,
    description: row.description,
    services: row.services || [],
    quotation: row.quotation,
    diagnosis: row.diagnosis,
    estimatedCost: row.estimated_cost ? parseFloat(row.estimated_cost) : undefined,
    finalCost: row.final_cost ? parseFloat(row.final_cost) : undefined,
    intakePhotos: row.intake_photos || [],
    servicePhotos: row.service_photos || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    deliveredAt: row.delivered_at,
  };
}

// Service Order functions
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching service orders:', error);
    throw error;
  }
  
  return (data || []).map(mapServiceOrder);
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching service order:', error);
    throw error;
  }
  
  return data ? mapServiceOrder(data) : null;
}

export async function getServiceOrdersByClientId(clientId: string): Promise<ServiceOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching client orders:', error);
    throw error;
  }
  
  return (data || []).map(mapServiceOrder);
}

export async function getServiceOrdersByTechnicianId(technicianId: string): Promise<ServiceOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('technician_id', technicianId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching technician orders:', error);
    throw error;
  }
  
  return (data || []).map(mapServiceOrder);
}

export async function getServiceOrdersByVehicleId(vehicleId: string): Promise<ServiceOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('service_orders')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching vehicle orders:', error);
    throw error;
  }
  
  return (data || []).map(mapServiceOrder);
}

export async function saveServiceOrder(order: Partial<ServiceOrder>): Promise<ServiceOrder> {
  const supabase = createClient();
  
  // Convertir camelCase a snake_case para Supabase
  const dbOrder: any = {
    id: order.id,
    order_number: order.orderNumber,
    vehicle_id: order.vehicleId,
    client_id: order.clientId,
    technician_id: order.technicianId,
    state: order.state,
    description: order.description,
    services: order.services || [],
    quotation: order.quotation,
    diagnosis: order.diagnosis,
    estimated_cost: order.estimatedCost?.toString(),
    final_cost: order.finalCost?.toString(),
    intake_photos: order.intakePhotos || [],
    service_photos: order.servicePhotos || [],
    updated_at: new Date().toISOString(),
    completed_at: order.completedAt,
    delivered_at: order.deliveredAt,
  };
  
  // Si tiene ID, actualizar; si no, crear
  if (order.id) {
    const { data, error } = await supabase
      .from('service_orders')
      .update(dbOrder)
      .eq('id', order.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service order:', error);
      throw error;
    }
    
    return mapServiceOrder(data);
  } else {
    // Crear nuevo
    dbOrder.id = crypto.randomUUID();
    dbOrder.created_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('service_orders')
      .insert(dbOrder)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service order:', error);
      throw error;
    }
    
    return mapServiceOrder(data);
  }
}

export async function updateServiceOrder(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder | null> {
  const supabase = createClient();
  
  const dbUpdates: any = {};
  if (updates.orderNumber !== undefined) dbUpdates.order_number = updates.orderNumber;
  if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
  if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
  if (updates.technicianId !== undefined) dbUpdates.technician_id = updates.technicianId;
  if (updates.state !== undefined) dbUpdates.state = updates.state;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.services !== undefined) dbUpdates.services = updates.services;
  if (updates.quotation !== undefined) dbUpdates.quotation = updates.quotation;
  if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
  if (updates.estimatedCost !== undefined) dbUpdates.estimated_cost = updates.estimatedCost.toString();
  if (updates.finalCost !== undefined) dbUpdates.final_cost = updates.finalCost.toString();
  if (updates.intakePhotos !== undefined) dbUpdates.intake_photos = updates.intakePhotos;
  if (updates.servicePhotos !== undefined) dbUpdates.service_photos = updates.servicePhotos;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
  if (updates.deliveredAt !== undefined) dbUpdates.delivered_at = updates.deliveredAt;
  
  dbUpdates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('service_orders')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error updating service order:', error);
    throw error;
  }
  
  return data ? mapServiceOrder(data) : null;
}

export async function deleteServiceOrder(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('service_orders')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting service order:', error);
    throw error;
  }
}

// Similar para otras entidades (Clients, Vehicles, etc.)
// ... (implementar siguiendo el mismo patrón)
```

**Nota**: Necesitarás implementar funciones similares para todas las entidades (Clients, Vehicles, Users, Expenses, Revenues, Reports, StateHistory).

### Paso 6: Migrar Datos Existentes (Opcional)

Si tienes datos en localStorage que quieres migrar:

#### 6.1. Script de Exportación

Crea un archivo `scripts/export-localStorage.ts`:

```typescript
// scripts/export-localStorage.ts
import {
  getUsers,
  getClients,
  getVehicles,
  getServiceOrders,
  getStateHistory,
  getExpenses,
  getRevenues,
  getReports,
} from '@/lib/storage';

export function exportAllData() {
  const data = {
    users: getUsers(),
    clients: getClients(),
    vehicles: getVehicles(),
    serviceOrders: getServiceOrders(),
    stateHistory: getStateHistory(),
    expenses: getExpenses(),
    revenues: getRevenues(),
    reports: getReports(),
  };
  
  // Descargar como JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `localStorage-backup-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return data;
}
```

#### 6.2. Script de Importación a Supabase

Crea un archivo `scripts/import-to-supabase.ts`:

```typescript
// scripts/import-to-supabase.ts
import { createClient } from '@/lib/supabase/client';
import type { ServiceOrder, Client, Vehicle } from '@/lib/types';

export async function importToSupabase(data: any) {
  const supabase = createClient();
  
  try {
    // 1. Importar Clientes
    if (data.clients && data.clients.length > 0) {
      const clientsToInsert = data.clients.map((c: Client) => ({
        id: c.id,
        name: c.name,
        id_number: c.idNumber,
        phone: c.phone,
        email: c.email,
        address: c.address,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      }));
      
      const { error } = await supabase
        .from('clients')
        .upsert(clientsToInsert, { onConflict: 'id' });
      
      if (error) throw error;
      console.log(`✅ Importados ${clientsToInsert.length} clientes`);
    }
    
    // 2. Importar Vehículos
    if (data.vehicles && data.vehicles.length > 0) {
      const vehiclesToInsert = data.vehicles.map((v: Vehicle) => ({
        id: v.id,
        client_id: v.clientId,
        brand: v.brand,
        model: v.model,
        year: v.year,
        license_plate: v.licensePlate,
        vin: v.vin,
        color: v.color,
      }));
      
      const { error } = await supabase
        .from('vehicles')
        .upsert(vehiclesToInsert, { onConflict: 'id' });
      
      if (error) throw error;
      console.log(`✅ Importados ${vehiclesToInsert.length} vehículos`);
    }
    
    // 3. Importar Órdenes de Servicio
    if (data.serviceOrders && data.serviceOrders.length > 0) {
      const ordersToInsert = data.serviceOrders.map((o: ServiceOrder) => ({
        id: o.id,
        order_number: o.orderNumber,
        vehicle_id: o.vehicleId,
        client_id: o.clientId,
        technician_id: o.technicianId,
        state: o.state,
        description: o.description,
        services: o.services,
        quotation: o.quotation,
        diagnosis: o.diagnosis,
        estimated_cost: o.estimatedCost?.toString(),
        final_cost: o.finalCost?.toString(),
        intake_photos: o.intakePhotos,
        service_photos: o.servicePhotos,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        completed_at: o.completedAt,
        delivered_at: o.deliveredAt,
      }));
      
      const { error } = await supabase
        .from('service_orders')
        .upsert(ordersToInsert, { onConflict: 'id' });
      
      if (error) throw error;
      console.log(`✅ Importadas ${ordersToInsert.length} órdenes de servicio`);
    }
    
    // ... Similar para otras entidades
    
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}
```

#### 6.3. Ejecutar Migración

En un componente temporal o en la consola del navegador:

```typescript
// En un componente temporal o página de admin
import { exportAllData } from '@/scripts/export-localStorage';
import { importToSupabase } from '@/scripts/import-to-supabase';

// Exportar datos
const data = exportAllData();

// Importar a Supabase
await importToSupabase(data);
```

### Paso 7: Manejo de Fotos en Supabase Storage

Las fotos deben migrarse de Base64 a Supabase Storage:

```typescript
// lib/storage-photos.ts
import { createClient } from '@/lib/supabase/client';

export async function uploadPhotoToSupabase(file: File, path: string): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase.storage
    .from('workshop-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('workshop-photos')
    .getPublicUrl(data.path);
  
  return publicUrl;
}

export async function migrateBase64ToStorage(base64String: string, orderId: string, type: 'intake' | 'service'): Promise<string> {
  // Convertir Base64 a Blob
  const response = await fetch(base64String);
  const blob = await response.blob();
  
  // Crear File desde Blob
  const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
  
  // Subir a Supabase Storage
  const path = `${orderId}/${type}/${file.name}`;
  return await uploadPhotoToSupabase(file, path);
}
```

### Paso 8: Verificación y Testing

1. **Probar Funciones Básicas**
   ```typescript
   // Crear una orden de prueba
   const testOrder = await saveServiceOrder({
     vehicleId: 'test-vehicle-id',
     clientId: 'test-client-id',
     state: 'reception',
     description: 'Orden de prueba',
     services: [],
     intakePhotos: [],
     servicePhotos: [],
   });
   
   console.log('Orden creada:', testOrder);
   ```

2. **Verificar en Supabase Dashboard**
   - Ve a "Table Editor" → `service_orders`
   - Deberías ver la orden creada

3. **Probar Lectura**
   ```typescript
   const orders = await getServiceOrders();
   console.log('Órdenes:', orders);
   ```

4. **Probar Actualización**
   ```typescript
   await updateServiceOrder(testOrder.id, {
     state: 'process'
   });
   ```

5. **Probar Eliminación**
   ```typescript
   await deleteServiceOrder(testOrder.id);
   ```

### Paso 9: Actualizar Autenticación (Opcional)

Si quieres usar Supabase Auth en lugar de localStorage:

1. **Configurar Supabase Auth**
   - En Supabase Dashboard → Authentication → Settings
   - Configurar providers (Email, Google, etc.)

2. **Actualizar `lib/auth-context.tsx`**
   - Usar `supabase.auth` en lugar de localStorage
   - Implementar signIn, signOut, etc.

### Consideraciones Importantes

#### Mapeo de Nombres de Columnas

Supabase usa `snake_case` pero TypeScript usa `camelCase`. Necesitas mapear:

```typescript
// TypeScript (camelCase)
interface ServiceOrder {
  orderNumber: string;
  vehicleId: string;
  clientId: string;
}

// Supabase (snake_case)
{
  order_number: string;
  vehicle_id: string;
  client_id: string;
}
```

#### Manejo de Errores

Siempre maneja errores de Supabase:

```typescript
const { data, error } = await supabase.from('table').select('*');

if (error) {
  console.error('Error:', error);
  // Manejar error apropiadamente
  throw error;
}
```

#### Row Level Security (RLS)

Las políticas RLS están configuradas en el script SQL. Asegúrate de que:
- Los usuarios autenticados puedan leer/escribir según su rol
- Los clientes (sin auth) puedan leer sus propios datos
- Los administradores tengan acceso completo

#### Límites de Supabase Free Tier

- **500 MB de base de datos**
- **1 GB de storage**
- **2 GB de bandwidth**
- **50,000 usuarios activos/mes**

Para producción, considera el plan Pro.

### Checklist de Migración

- [ ] Proyecto creado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Script SQL ejecutado
- [ ] Tablas creadas y verificadas
- [ ] `lib/db.ts` actualizado para usar Supabase
- [ ] Funciones de todas las entidades implementadas
- [ ] Datos migrados (si aplica)
- [ ] Fotos migradas a Storage (si aplica)
- [ ] Testing completo
- [ ] Componentes funcionando correctamente
- [ ] Autenticación actualizada (si aplica)
- [ ] Desplegado a producción

---

## Conclusión

## Conclusión

El sistema actual de localStorage es **adecuado para desarrollo y prototipos**, pero **no es adecuado para producción** con múltiples usuarios. La arquitectura está bien diseñada para facilitar la migración futura a una base de datos real.

### Cuándo Usar localStorage

✅ Desarrollo local
✅ Prototipos rápidos
✅ Aplicaciones single-user
✅ Demos y presentaciones
✅ Aplicaciones offline-first simples

### Cuándo NO Usar localStorage

❌ Producción con múltiples usuarios
❌ Datos sensibles
❌ Grandes volúmenes de datos
❌ Necesidad de sincronización
❌ Aplicaciones empresariales

---

## Referencias

- **Archivos Clave**:
  - `lib/types.ts` - Definiciones de tipos
  - `lib/storage.ts` - Funciones de localStorage
  - `lib/db.ts` - Capa de abstracción async

- **Documentación**:
  - [MDN: localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
  - [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

---

**Última Actualización**: Diciembre 2024
**Versión del Sistema**: 1.0.0
