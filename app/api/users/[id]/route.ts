const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Verificar si es un usuario por defecto
    const defaultUserIds = ['default-admin', 'default-client', 'default-technician', 'default-quality'];
    if (defaultUserIds.includes(id)) {
      return Response.json(
        { error: 'No se pueden eliminar los usuarios por defecto del sistema' },
        { status: 403 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting user:', response.status, errorText);
      throw new Error(`Error al eliminar usuario: ${response.status} ${response.statusText}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return Response.json(
      { error: `Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

