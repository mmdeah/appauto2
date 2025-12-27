const API_BASE_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar params como Promise o objeto directo (Next.js 13+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    
    if (!id) {
      return Response.json(
        { error: 'ID es requerido' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
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

