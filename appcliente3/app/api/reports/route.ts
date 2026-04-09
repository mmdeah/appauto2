const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener reportes');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return Response.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Error al crear reporte');
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error creating report:', error);
    return Response.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}

// PUT y DELETE se manejan en /api/reports/[id]/route.ts

