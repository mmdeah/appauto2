/**
 * Usuarios por defecto del sistema
 * Estos usuarios no se pueden modificar ni eliminar
 */
export const DEFAULT_USERS = [
  {
    id: 'default-admin',
    email: 'admin@taller.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin' as const,
    createdAt: new Date('2024-01-01').toISOString(),
    isDefault: true, // Marca para identificar usuarios por defecto
  },
  {
    id: 'default-client',
    email: 'cliente@ejemplo.com',
    password: 'cliente123',
    name: 'Cliente Demo',
    role: 'client' as const,
    createdAt: new Date('2024-01-01').toISOString(),
    isDefault: true,
  },
  {
    id: 'default-technician',
    email: 'tecnico@taller.com',
    password: 'tecnico123',
    name: 'Técnico',
    role: 'technician' as const,
    createdAt: new Date('2024-01-01').toISOString(),
    isDefault: true,
  },
  {
    id: 'default-quality',
    email: 'calidad@taller.com',
    password: 'calidad123',
    name: 'Control de Calidad',
    role: 'quality-control' as const,
    createdAt: new Date('2024-01-01').toISOString(),
    isDefault: true,
  },
] as const

/**
 * Inicializa los usuarios por defecto en la API
 * Solo crea los usuarios si no existen
 */
export async function initializeDefaultUsers(): Promise<void> {
  try {
    const { getUsers, saveUser } = await import('./db')
    const existingUsers = await getUsers()
    
    // Crear usuarios por defecto que no existan
    for (const defaultUser of DEFAULT_USERS) {
      const exists = existingUsers.some(u => u.id === defaultUser.id || u.email === defaultUser.email)
      
      if (!exists) {
        console.log(`[v0] Creando usuario por defecto: ${defaultUser.email}`)
        await saveUser(defaultUser)
      }
    }
    
    console.log('[v0] Usuarios por defecto inicializados')
  } catch (error) {
    console.error('[v0] Error inicializando usuarios por defecto:', error)
  }
}

/**
 * Verifica si un usuario es un usuario por defecto
 */
export function isDefaultUser(userId: string): boolean {
  return DEFAULT_USERS.some(u => u.id === userId)
}

/**
 * Verifica si un email pertenece a un usuario por defecto
 */
export function isDefaultUserEmail(email: string): boolean {
  return DEFAULT_USERS.some(u => u.email === email)
}

