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
    
    // Asegurar que el ID esté presente
    if (!body.id) {
      body.id = Date.now().toString();
    }
    
    console.log('📝 Creando orden con ID:', body.id);
    
    const response = await fetch(`${API_BASE_URL}/api/service_orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor JSON al crear:', response.status, errorText);
      throw new Error(`Error al crear orden: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Orden creada con ID:', data.id);
    return Response.json(data);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return Response.json(
      { error: `Error al crear orden: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

// PUT se maneja en /api/orders/[id]/route.ts

// DELETE se maneja en /api/orders/[id]/route.ts

