import { NextRequest } from 'next/server'

const JSON_SERVER_URL = process.env.JSON_SERVER_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licensePlate = searchParams.get('licensePlate')
    const clientName = searchParams.get('clientName')
    
    let url = `${JSON_SERVER_URL}/api/archived-orders`
    
    // Si hay filtros, agregarlos
    if (licensePlate || clientName) {
      const params = new URLSearchParams()
      if (licensePlate) params.append('licensePlate', licensePlate)
      if (clientName) params.append('clientName', clientName)
      url += `?${params.toString()}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Error al obtener órdenes archivadas')
    }
    const data = await response.json()
    
    // Filtrar por placa o nombre de cliente si se proporciona
    let filteredData = Array.isArray(data) ? data : []
    
    if (licensePlate) {
      filteredData = filteredData.filter((order: any) =>
        order.vehicle?.licensePlate?.toLowerCase().includes(licensePlate.toLowerCase())
      )
    }
    
    if (clientName) {
      filteredData = filteredData.filter((order: any) =>
        order.client?.name?.toLowerCase().includes(clientName.toLowerCase())
      )
    }
    
    return Response.json(filteredData)
  } catch (error) {
    console.error('Error fetching archived orders:', error)
    return Response.json({ error: 'Error al obtener órdenes archivadas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${JSON_SERVER_URL}/api/archived-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error('Error al archivar orden')
    }
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error archiving order:', error)
    return Response.json({ error: 'Error al archivar orden' }, { status: 500 })
  }
}


