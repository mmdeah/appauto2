// NOTE: This file is designed for client components only
// It uses localStorage via storage.ts functions
// Server components should use db-server.ts for Supabase operations
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
  Report, // Added Report export
} from "./types"
import {
  getUsers as storageGetUsers,
  getUserByEmail as storageGetUserByEmail,
  saveUser as storageSaveUser,
  getVehicles as storageGetVehicles,
  getVehiclesByClientId as storageGetVehiclesByClientId,
  getVehicleByLicensePlate as storageGetVehicleByLicensePlate,
  saveVehicle as storageSaveVehicle,
  getServiceOrders as storageGetServiceOrders,
  getServiceOrderById as storageGetServiceOrderById,
  getServiceOrdersByClientId as storageGetServiceOrdersByClientId,
  getServiceOrdersByVehicleId as storageGetServiceOrdersByVehicleId,
  getServiceOrdersByTechnicianId as storageGetServiceOrdersByTechnicianId,
  saveServiceOrder as storageSaveServiceOrder,
  getStateHistoryByOrderId as storageGetStateHistoryByOrderId,
  createStateHistory as storageCreateStateHistory,
  updateQuotation as storageUpdateQuotation,
  deleteServiceOrder as storageDeleteServiceOrder,
  getClients as storageGetClients,
  getClientById as storageGetClientById,
  getClientByIdNumber as storageGetClientByIdNumber,
  getClientByEmail as storageGetClientByEmail,
  saveClient as storageSaveClient,
  getExpenses as storageGetExpenses,
  createExpense as storageCreateExpense,
  deleteExpense as storageDeleteExpense,
  getRevenues as storageGetRevenues,
  createRevenue as storageCreateRevenue,
  getReports as storageGetReports,
  createReport as storageCreateReport,
  deleteReport as storageDeleteReport,
  updateReport as storageUpdateReport,
} from "./storage"

// This file uses localStorage only - no Supabase imports to avoid next/headers issues

// User functions
export async function getUsers(): Promise<User[]> {
  // Always use localStorage in client components to avoid importing server modules
  // Server components should use db-server.ts functions directly
  return Promise.resolve(storageGetUsers())
}

export async function getUserByEmail(email: string): Promise<User | null> {
  // Always use localStorage in client components
  const user = storageGetUserByEmail(email)
  return Promise.resolve(user || null)
}

export async function saveUser(user: Partial<User> & { email: string; name: string; role: string }): Promise<User> {
  // Always use localStorage in client components
  return Promise.resolve(storageSaveUser(user))
}

// Client functions for customer registration without accounts
export async function getClients(): Promise<Client[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetClients())
}

export async function getClientById(id: string): Promise<Client | null> {
  // Always use localStorage in client components
  const client = storageGetClientById(id)
  return Promise.resolve(client || null)
}

export async function getClientByIdNumber(idNumber: string): Promise<Client | null> {
  // Always use localStorage in client components
  const client = storageGetClientByIdNumber(idNumber)
  return Promise.resolve(client || null)
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  // Always use localStorage in client components
  const client = storageGetClientByEmail(email)
  return Promise.resolve(client || null)
}

export async function saveClient(client: Client): Promise<Client> {
  // Always use localStorage in client components
  storageSaveClient(client)
  return Promise.resolve(client)
}

// Vehicle functions
export async function getVehicles(): Promise<Vehicle[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetVehicles())
}

export async function getVehiclesByClientId(clientId: string): Promise<Vehicle[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetVehiclesByClientId(clientId))
}

export async function getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
  // Always use localStorage in client components
  const vehicle = storageGetVehicleByLicensePlate(licensePlate)
  return Promise.resolve(vehicle || null)
}

export async function saveVehicle(
  vehicle: Partial<Vehicle> & { brand: string; model: string; year: number; license_plate: string; client_id: string },
): Promise<Vehicle> {
  // Always use localStorage in client components
  return Promise.resolve(storageSaveVehicle(vehicle))
}

// Service Order functions
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetServiceOrders())
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  // Always use localStorage in client components
  const order = storageGetServiceOrderById(id)
  return Promise.resolve(order || null)
}

export async function getServiceOrderByPublicToken(token: string): Promise<ServiceOrder | null> {
  const { getServiceOrderByPublicToken: storageGetServiceOrderByPublicToken } = await import("./storage")
  const order = storageGetServiceOrderByPublicToken(token)
  return Promise.resolve(order || null)
}

export async function getServiceOrdersByClientId(clientId: string): Promise<ServiceOrder[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetServiceOrdersByClientId(clientId))
}

export async function getServiceOrdersByVehicleId(vehicleId: string): Promise<ServiceOrder[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetServiceOrdersByVehicleId(vehicleId))
}

export async function getServiceOrdersByTechnicianId(technicianId: string): Promise<ServiceOrder[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetServiceOrdersByTechnicianId(technicianId))
}

export async function saveServiceOrder(order: Partial<ServiceOrder>): Promise<ServiceOrder> {
  // Always use localStorage in client components
  return Promise.resolve(storageSaveServiceOrder(order))
}

export async function updateServiceOrder(id: string, updates: Partial<ServiceOrder>): Promise<ServiceOrder | null> {
  // Always use localStorage in client components
  const order = storageGetServiceOrderById(id)
  if (!order) return null

  const updatedOrder = { ...order, ...updates }
  return Promise.resolve(storageSaveServiceOrder(updatedOrder))
}

// State History functions
export async function getStateHistoryByOrderId(orderId: string): Promise<StateHistory[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetStateHistoryByOrderId(orderId))
}

export async function createStateHistory(history: Omit<StateHistory, "id" | "changed_at">): Promise<StateHistory> {
  // Always use localStorage in client components
  return Promise.resolve(storageCreateStateHistory(history))
}

export async function saveStateHistory(history: StateHistory): Promise<void> {
  const { id, changedAt, ...historyData } = history
  await createStateHistory({
    ...historyData,
    serviceOrderId: history.serviceOrderId,
    previousState: history.previousState,
    newState: history.newState,
    changedBy: history.changedBy,
    notes: history.notes,
  })
  return Promise.resolve()
}

// Expense type and functions
export async function getExpenses(): Promise<Expense[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetExpenses())
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  // Always use localStorage in client components
  return Promise.resolve(storageCreateExpense(expense))
}

export async function deleteExpense(id: string): Promise<void> {
  // Always use localStorage in client components
  storageDeleteExpense(id)
  return Promise.resolve()
}

// Quotation functions
export async function updateQuotation(serviceOrderId: string, quotation: Quotation): Promise<void> {
  // Always use localStorage in client components
  return Promise.resolve(storageUpdateQuotation(serviceOrderId, quotation))
}

// Revenue functions to track income from delivered orders
export async function getRevenues(): Promise<Revenue[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetRevenues())
}

export async function createRevenue(revenue: Omit<Revenue, "id" | "created_at">): Promise<Revenue> {
  // Always use localStorage in client components
  return Promise.resolve(storageCreateRevenue(revenue))
}

// Dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await getServiceOrders()
  const expenses = await getExpenses()
  const revenues = await getRevenues()

  // Filter completed orders
  const completedOrders = orders.filter((o) => o.state === "completed" || o.state === "delivered")

  // Calculate unique vehicles served
  const uniqueVehicles = new Set(completedOrders.map((o) => o.vehicle_id))
  const vehiclesServed = uniqueVehicles.size

  const totalSales = revenues.reduce((sum, revenue) => sum + revenue.amount, 0)

  // Calculate average ticket
  const averageTicket = completedOrders.length > 0 ? totalSales / completedOrders.length : 0

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate profit
  const profit = totalSales - totalExpenses

  // Count active orders (not delivered)
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

// Report functions for technical diagnostics
export async function getReports(): Promise<Report[]> {
  // Always use localStorage in client components
  return Promise.resolve(storageGetReports())
}

export async function createReport(report: Omit<Report, "id">): Promise<Report> {
  // Always use localStorage in client components
  return Promise.resolve(storageCreateReport(report))
}

export async function deleteReport(id: string): Promise<void> {
  // Always use localStorage in client components
  storageDeleteReport(id)
  return Promise.resolve()
}

export async function updateReport(id: string, updates: Partial<Report>): Promise<Report> {
  // Always use localStorage in client components
  storageUpdateReport(id, updates)
  const reports = await getReports()
  const updated = reports.find(r => r.id === id)
  if (!updated) {
    throw new Error("Report not found")
  }
  return Promise.resolve(updated)
}

// Delete Service Order function
export async function deleteServiceOrder(id: string): Promise<void> {
  // Always use localStorage in client components
  storageDeleteServiceOrder(id)
  return Promise.resolve()
}
