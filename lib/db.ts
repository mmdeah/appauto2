// NOTE: This file now uses API Routes that connect to JSON Server
// API Routes handle the connection to the JSON Server backend
import type {
  User,
  Client,
  Vehicle,
  ServiceOrder,
  StateHistory,
  Expense,
  Quotation,
  DashboardStats,
  Revenue,
  Report,
  ServiceRating,
  ArchivedOrder,
  ChecklistCategory,
  PreventiveReview,
} from "./types"

// URL base de la API (Next.js API Routes)
const API_BASE = '/api'

// Helper para hacer requests
async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `API Error: ${response.statusText}`)
  }
  
  return response.json()
}

// User functions
export async function getUsers(): Promise<User[]> {
  return apiRequest('/users')
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  console.log('[v0] Searching for user with email:', email)
  console.log('[v0] Available users:', users.map(u => ({ email: u.email, name: u.name, role: u.role })))
  const found = users.find(u => u.email === email) || null
  console.log('[v0] User found:', found ? `${found.name} (${found.role})` : 'Not found')
  return found
}

export async function saveUser(user: Partial<User> & { email: string; name: string; role: string }): Promise<User> {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      ...user,
      id: user.id || Date.now().toString(),
      createdAt: user.createdAt || new Date().toISOString(),
    })
  })
}

// Client functions
export async function getClients(): Promise<Client[]> {
  return apiRequest('/clients')
}

export async function getClientById(id: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find(c => c.id === id) || null
}

export async function getClientByIdNumber(idNumber: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find(c => c.idNumber === idNumber) || null
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find(c => c.email?.toLowerCase() === email.toLowerCase()) || null
}

export async function saveClient(client: Client): Promise<Client> {
  return apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify({
      ...client,
      id: client.id || Date.now().toString(),
      createdAt: client.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  try {
    const client = await getClientById(id)
    if (!client) return null
    
    return apiRequest(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...client,
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    })
  } catch {
    return null
  }
}

// Vehicle functions
export async function getVehicles(): Promise<Vehicle[]> {
  return apiRequest('/vehicles')
}

export async function getVehiclesByClientId(clientId: string): Promise<Vehicle[]> {
  const vehicles = await getVehicles()
  return vehicles.filter(v => v.clientId === clientId)
}

export async function getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
  const vehicles = await getVehicles()
  // Normalizar la placa: eliminar espacios, guiones y convertir a mayúsculas
  const normalizedSearch = licensePlate.replace(/[\s\-]/g, '').toUpperCase()
  return vehicles.find(v => {
    if (!v.licensePlate) return false
    const normalizedPlate = v.licensePlate.replace(/[\s\-]/g, '').toUpperCase()
    return normalizedPlate === normalizedSearch
  }) || null
}

export async function saveVehicle(
  vehicle: Partial<Vehicle> & { brand: string; model: string; year: number; licensePlate: string; clientId: string },
): Promise<Vehicle> {
  return apiRequest('/vehicles', {
    method: 'POST',
    body: JSON.stringify({
      ...vehicle,
      id: vehicle.id || Date.now().toString(),
    })
  })
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  try {
    const vehicles = await getVehicles()
    const vehicle = vehicles.find(v => v.id === id)
    if (!vehicle) return null
    
    return apiRequest(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...vehicle,
        ...updates
      })
    })
  } catch {
    return null
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiRequest(`/vehicles/${id}`, {
    method: 'DELETE'
  })
}

// Service Order functions
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return apiRequest('/orders')
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  try {
    return await apiRequest(`/orders/${id}`)
  } catch {
    return null
  }
}

export async function getServiceOrderByPublicToken(token: string): Promise<ServiceOrder | null> {
  const orders = await getServiceOrders()
  return orders.find(o => o.publicToken === token) || null
}

export async function getServiceOrdersByClientId(clientId: string): Promise<ServiceOrder[]> {
  const orders = await getServiceOrders()
  return orders.filter(o => o.clientId === clientId)
}

export async function getServiceOrdersByVehicleId(vehicleId: string): Promise<ServiceOrder[]> {
  const orders = await getServiceOrders()
  return orders.filter(o => o.vehicleId === vehicleId)
}

export async function getServiceOrdersByTechnicianId(technicianId: string): Promise<ServiceOrder[]> {
  const orders = await getServiceOrders()
  return orders.filter(o => o.technicianId === technicianId)
}

export async function saveServiceOrder(order: Partial<ServiceOrder>): Promise<ServiceOrder> {
  if (order.id) {
    return apiRequest(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...order,
        updatedAt: new Date().toISOString(),
      })
    })
  } else {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        id: order.id || Date.now().toString(),
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  }
}

export async function updateServiceOrder(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder | null> {
  try {
    const order = await getServiceOrderById(id)
    if (!order) return null
    
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...order,
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    })
  } catch {
    return null
  }
}

export async function deleteServiceOrder(id: string): Promise<void> {
  await apiRequest(`/orders/${id}`, {
    method: 'DELETE'
  })
}

// State History functions
export async function getStateHistoryByOrderId(orderId: string): Promise<StateHistory[]> {
  const allHistory = await apiRequest('/state-history')
  return allHistory.filter((h: StateHistory) => h.serviceOrderId === orderId)
}

export async function createStateHistory(history: Omit<StateHistory, "id" | "changedAt">): Promise<StateHistory> {
  return apiRequest('/state-history', {
    method: 'POST',
    body: JSON.stringify({
      ...history,
      id: Date.now().toString(),
      changedAt: new Date().toISOString()
    })
  })
}

export async function saveStateHistory(history: StateHistory): Promise<void> {
  await createStateHistory({
    serviceOrderId: history.serviceOrderId,
    previousState: history.previousState,
    newState: history.newState,
    changedBy: history.changedBy,
    notes: history.notes,
  })
}

// Expense functions
export async function getExpenses(): Promise<Expense[]> {
  return apiRequest('/expenses')
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  return apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      ...expense,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    })
  })
}

export async function deleteExpense(id: string): Promise<void> {
  await apiRequest(`/expenses/${id}`, {
    method: 'DELETE'
  })
}

// Quotation functions
export async function updateQuotation(serviceOrderId: string, quotation: Quotation): Promise<void> {
  const order = await getServiceOrderById(serviceOrderId)
  if (order) {
    await updateServiceOrder(serviceOrderId, { quotation })
  }
}

// Revenue functions
export async function getRevenues(): Promise<Revenue[]> {
  return apiRequest('/revenues')
}

export async function createRevenue(revenue: Omit<Revenue, "id" | "created_at">): Promise<Revenue> {
  return apiRequest('/revenues', {
    method: 'POST',
    body: JSON.stringify({
      ...revenue,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    })
  })
}

export async function deleteRevenue(id: string): Promise<void> {
  return apiRequest(`/revenues/${id}`, {
    method: 'DELETE'
  })
}

// Report functions
export async function getReports(): Promise<Report[]> {
  return apiRequest('/reports')
}

export async function createReport(report: Omit<Report, "id">): Promise<Report> {
  return apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify({
      ...report,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    })
  })
}

export async function deleteReport(id: string): Promise<void> {
  await apiRequest(`/reports/${id}`, {
    method: 'DELETE'
  })
}

export async function updateReport(id: string, updates: Partial<Report>): Promise<Report> {
  return apiRequest(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}

// Dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await getServiceOrders()
  const expenses = await getExpenses()

  // Solo consideramos órdenes entregadas para las métricas de ventas
  const deliveredOrders = orders.filter((o) => o.state === "delivered")

  // Cada orden entregada se cuenta como un vehículo atendido (coincide con el contador de "Entregadas")
  const vehiclesServed = deliveredOrders.length

  // Total de ventas tomado directamente de las cotizaciones/facturas de las órdenes
  const totalSales = deliveredOrders.reduce((sum, order) => {
    const orderTotal = order.quotation?.total ?? 0
    return sum + orderTotal
  }, 0)

  const averageTicket = deliveredOrders.length > 0 ? totalSales / deliveredOrders.length : 0

  const totalExpenses = (await getExpenses()).reduce((sum, expense) => sum + expense.amount, 0)
  const profit = totalSales - totalExpenses

  // Órdenes activas: todas las que aún no están entregadas
  const activeOrders = orders.filter((o) => o.state !== "delivered").length

  return {
    vehiclesServed,
    averageTicket,
    totalSales,
    totalExpenses,
    profit,
    activeOrders,
  }
}

// Rating functions
export async function getRatings(): Promise<ServiceRating[]> {
  return apiRequest('/ratings')
}

export async function getRatingByOrderId(orderId: string): Promise<ServiceRating | null> {
  try {
    const ratings = await getRatings()
    return ratings.find(r => r.serviceOrderId === orderId) || null
  } catch {
    return null
  }
}

export async function createRating(rating: Omit<ServiceRating, "id" | "createdAt">): Promise<ServiceRating> {
  return apiRequest('/ratings', {
    method: 'POST',
    body: JSON.stringify({
      ...rating,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      resolved: false,
    })
  })
}

export async function updateRating(id: string, updates: Partial<ServiceRating>): Promise<ServiceRating> {
  return apiRequest(`/ratings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}

// Archived Orders functions
export async function createArchivedOrder(archivedOrder: Omit<ArchivedOrder, "id" | "archivedAt">): Promise<ArchivedOrder> {
  return apiRequest('/archived-orders', {
    method: 'POST',
    body: JSON.stringify({
      ...archivedOrder,
      archivedAt: new Date().toISOString(),
    }),
  })
}

export async function getArchivedOrders(): Promise<ArchivedOrder[]> {
  return apiRequest('/archived-orders')
}

export async function getArchivedOrderById(id: string): Promise<ArchivedOrder | null> {
  try {
    return await apiRequest(`/archived-orders/${id}`)
  } catch (error) {
    return null
  }
}

// Checklist Template functions
export async function getChecklistCategories(): Promise<ChecklistCategory[]> {
  try {
    return await apiRequest('/checklist-categories')
  } catch {
    return []
  }
}

export async function saveChecklistCategory(category: Partial<ChecklistCategory>): Promise<ChecklistCategory> {
  if (category.id) {
    return apiRequest(`/checklist-categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    })
  } else {
    return apiRequest('/checklist-categories', {
      method: 'POST',
      body: JSON.stringify({
        ...category,
        id: Date.now().toString(),
      }),
    })
  }
}

export async function deleteChecklistCategory(id: string): Promise<void> {
  await apiRequest(`/checklist-categories/${id}`, {
    method: 'DELETE',
  })
}

// Preventive Review functions
export async function getPreventiveReviews(): Promise<PreventiveReview[]> {
  try {
    return await apiRequest('/preventive-reviews')
  } catch {
    return []
  }
}

export async function getPreventiveReviewByOrderId(orderId: string): Promise<PreventiveReview | null> {
  try {
    const reviews = await getPreventiveReviews()
    return reviews.find(r => r.serviceOrderId === orderId) || null
  } catch {
    return null
  }
}

export async function savePreventiveReview(review: Partial<PreventiveReview>): Promise<PreventiveReview> {
  if (review.id) {
    return apiRequest(`/preventive-reviews/${review.id}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    })
  } else {
    return apiRequest('/preventive-reviews', {
      method: 'POST',
      body: JSON.stringify({
        ...review,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }),
    })
  }
}
