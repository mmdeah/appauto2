const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verificar si se intenta crear un usuario con email de usuario por defecto
    const defaultEmails = ['admin@taller.com', 'cliente@ejemplo.com', 'tecnico@taller.com', 'calidad@taller.com'];
    if (defaultEmails.includes(body.email) && !body.id?.startsWith('default-')) {
      return Response.json(
        { error: 'Este email pertenece a un usuario por defecto y no se puede usar' },
        { status: 403 }
      );
    }
    
    // Si es un usuario existente (tiene ID), verificar si es por defecto
    if (body.id) {
      const defaultUserIds = ['default-admin', 'default-client', 'default-technician', 'default-quality'];
      if (defaultUserIds.includes(body.id)) {
        // Permitir actualización pero mantener campos críticos
        const currentUsers = await fetch(`${API_BASE_URL}/api/users`).then(r => r.json());
        const existingUser = currentUsers.find((u: any) => u.id === body.id);
        if (existingUser) {
          // Mantener email, password y role de usuarios por defecto
          body.email = existingUser.email;
          body.password = existingUser.password;
          body.role = existingUser.role;
          body.isDefault = true;
        }
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear usuario');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

