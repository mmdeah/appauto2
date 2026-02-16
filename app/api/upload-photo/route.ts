const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const type = formData.get('type') as string;

    if (!file || !orderId || !type) {
      return Response.json(
        { error: 'file, orderId y type son requeridos' },
        { status: 400 }
      );
    }

    // Crear FormData para enviar al servidor JSON
    const uploadFormData = new FormData();
    uploadFormData.append('photo', file);
    uploadFormData.append('orderId', orderId);
    uploadFormData.append('type', type);

    // Llamar al servidor JSON interno
    const response = await fetch(`${API_BASE_URL}/api/upload-photo`, {
      method: 'POST',
      body: uploadFormData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al subir foto');
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return Response.json(
      { error: 'Error al subir la foto' },
      { status: 500 }
    );
  }
}

