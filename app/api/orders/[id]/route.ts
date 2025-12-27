const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return Response.json(null);
      }
      throw new Error('Error al obtener orden');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching order:', error);
    return Response.json(
      { error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor JSON:', response.status, errorText);
      throw new Error(`Error al actualizar orden: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('❌ Error updating order:', error);
    return Response.json(
      { error: `Error al actualizar orden: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${params.id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar orden');
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return Response.json(
      { error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
