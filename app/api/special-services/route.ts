const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/special-services`);
    if (!response.ok) throw new Error('Error al obtener servicios especiales');
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching special-services:', error);
    return Response.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/special-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Error al crear');
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating special-service:', error);
    return Response.json({ error: 'Error al crear' }, { status: 500 });
  }
}
