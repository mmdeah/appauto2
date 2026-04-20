const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preventive-reviews`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('Error al obtener revisiones');
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching preventive reviews:', error);
    return Response.json({ error: 'Error al obtener revisiones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/preventive-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) throw new Error('Error al crear revisión');
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating review:', error);
    return Response.json({ error: 'Error al crear revisión' }, { status: 500 });
  }
}
