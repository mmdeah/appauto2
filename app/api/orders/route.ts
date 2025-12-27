const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/service_orders`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener órdenes');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return Response.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear orden');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar orden');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error updating order:', error);
    return Response.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${id}`, {
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

