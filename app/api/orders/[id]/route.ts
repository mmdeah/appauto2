const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET(
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
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${id}`, {
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
    
    // Asegurar que el ID en el body coincida con el de la URL
    const orderData = { ...body, id };
    
    console.log('📝 Actualizando orden con ID:', id);
    
    // Primero verificar que la orden existe
    const checkResponse = await fetch(`${API_BASE_URL}/api/service_orders/${id}`, {
      cache: 'no-store'
    });
    
    if (!checkResponse.ok) {
      console.error('❌ Orden no encontrada con ID:', id);
      // Si no existe, intentar crearla
      console.log('🔄 Intentando crear orden en lugar de actualizar...');
      const createResponse = await fetch(`${API_BASE_URL}/api/service_orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Error al crear/actualizar orden: ${createResponse.status} ${errorText}`);
      }
      
      const createdData = await createResponse.json();
      return Response.json(createdData);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
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
