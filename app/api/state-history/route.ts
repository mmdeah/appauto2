const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/state_history`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener historial');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching state history:', error);
    return Response.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/state_history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear historial');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating state history:', error);
    return Response.json(
      { error: 'Error al crear historial' },
      { status: 500 }
    );
  }
}

