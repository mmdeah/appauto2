const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener clientes');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return Response.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear cliente');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating client:', error);
    return Response.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

