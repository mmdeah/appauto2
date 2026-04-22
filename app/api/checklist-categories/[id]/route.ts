const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) throw new Error('ID no proporcionado');

    const response = await fetch(`${API_BASE_URL}/api/checklist-categories/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw Error('Error al eliminar');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting:', error);
    return Response.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
