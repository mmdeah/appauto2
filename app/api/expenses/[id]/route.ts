const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${params.id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar gasto');
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return Response.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}

