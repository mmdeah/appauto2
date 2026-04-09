const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener vehículos');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return Response.json(
      { error: 'Error al obtener vehículos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear vehículo');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return Response.json(
      { error: 'Error al crear vehículo' },
      { status: 500 }
    );
  }
}

