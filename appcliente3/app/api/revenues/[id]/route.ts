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

    const url = `${API_BASE_URL}/api/revenues/${id}`;
    console.log('📝 Intentando eliminar ingreso con ID:', id, 'desde URL:', url);
    const response = await fetch(url, {
      method: 'DELETE'
    });
    console.log('📡 Respuesta del servidor DELETE por ID:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor JSON en DELETE por ID:', response.status, errorText);
      throw new Error(`Error al eliminar ingreso: ${response.status} ${response.statusText}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting revenue by ID:', error);
    return Response.json(
      { error: `Error al eliminar ingreso: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

