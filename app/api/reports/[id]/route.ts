const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar params como Promise o objeto directo (Next.js 13+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar reporte');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating report:', error);
    return Response.json(
      { error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar params como Promise o objeto directo (Next.js 13+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar reporte');
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return Response.json(
      { error: 'Error al eliminar reporte' },
      { status: 500 }
    );
  }
}

