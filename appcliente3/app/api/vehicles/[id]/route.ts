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

    const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor JSON en DELETE:', response.status, errorText);
      throw new Error(`Error al eliminar vehículo: ${response.status} ${response.statusText}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return Response.json(
      { error: `Error al eliminar vehículo: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

