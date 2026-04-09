const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function PUT(
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
    
    const body = await request.json();
    
    // Asegurar que el ID en el body coincida con el de la URL
    const clientData = { ...body, id };
    
    console.log('📝 Actualizando cliente con ID:', id);
    
    const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al actualizar cliente: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating client:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}


