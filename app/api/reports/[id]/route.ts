const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/reports/${params.id}`, {
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
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/${params.id}`, {
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

