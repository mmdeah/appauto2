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
    
    const response = await fetch(`${API_BASE_URL}/api/ratings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar calificación');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating rating:', error);
    return Response.json(
      { error: 'Error al actualizar calificación' },
      { status: 500 }
    );
  }
}

