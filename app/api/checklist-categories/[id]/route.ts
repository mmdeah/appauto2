const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function PUT(request: Request, context: any) {
  try {
    const { params } = context;
    // En Next.js 15+ "params" debe tratarse como promesa, o esperar una asincronía. 
    // Usaremos el id directamente si está disponible.
    const id = params?.id;
    if (!id) throw new Error('ID no proporcionado');

    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/checklist-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) throw new Error('Error al actualizar');
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating:', error);
    return Response.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const { params } = context;
    const id = params?.id;
    if (!id) throw new Error('ID no proporcionado');

    const response = await fetch(`${API_BASE_URL}/api/checklist-categories/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting:', error);
    return Response.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
