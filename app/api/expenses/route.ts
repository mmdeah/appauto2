const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/expenses`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener gastos');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return Response.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear gasto');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating expense:', error);
    return Response.json(
      { error: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}

// DELETE se maneja en /api/expenses/[id]/route.ts

