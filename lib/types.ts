export type UserRole = "admin" | "client" | "technician" | "quality-control"

export interface Client {
  id: string
  name: string
  idNumber: string // Cédula
  phone: string
  email: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  password: string // In production, this would be hashed
  name: string
  role: UserRole
  createdAt: string
}

export type ServiceState =
  | "reception" // Recepción del vehículo
  | "quotation" // Cotización en progreso
  | "process" // En proceso de reparación
  | "quality" // Control de calidad

export interface Vehicle {
  id: string
  clientId: string // Now references Client.id instead of User.id
  brand: string
  model: string
  year: number
  licensePlate: string
  vin?: string
  color?: string
}

export interface QualityControlCheck {
  vehicleClean: boolean
  noToolsInside: boolean
  properlyAssembled: boolean
  issueFixed: boolean
  additionalNotes?: string
  checkedBy?: string // userId
  checkedAt?: string
}

export interface ServiceOrder {
  id: string
  orderNumber?: string // Optional human-readable order number
  vehicleId: string
  clientId: string // Now references Client.id instead of User.id
  technicianId?: string
  state: ServiceState
  description: string
  services: ServiceItem[]
  quotation?: Quotation
  diagnosis?: string
  estimatedCost?: number
  finalCost?: number
  intakePhotos: string[] // Fotos de cómo ingresa el vehículo
  servicePhotos: string[] // Fotos del trabajo realizado por el técnico
  qualityControlCheck?: QualityControlCheck
  publicToken?: string // Token único para URL pública de visualización
  whatsappSent?: boolean // Indica si ya se envió el mensaje de WhatsApp inicial
  createdAt: string
  updatedAt: string
  completedAt?: string
  deliveredAt?: string
}

export interface ServiceItem {
  id: string
  description: string
  completed: boolean
  completedAt?: string
  completedBy?: string
}

export interface Quotation {
  id: string
  items: QuotationItem[]
  subtotal: number
  tax: number
  total: number
  includesTax: boolean
  createdAt: string
  createdBy: string
}

export interface QuotationItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface StateHistory {
  id: string
  serviceOrderId: string
  previousState: ServiceState
  newState: ServiceState
  changedBy: string // userId
  changedAt: string
  notes?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  created_at: string
}

export interface Revenue {
  id: string
  serviceOrderId: string
  amount: number
  date: string
  description: string
  created_at: string
}

export interface DashboardStats {
  vehiclesServed: number
  averageTicket: number
  totalSales: number
  totalExpenses: number
  profit: number
  activeOrders: number
}

export interface Report {
  id: string
  licensePlate: string
  category: string
  text: string
  createdAt: string
  resolved?: boolean // Estado del reporte: resuelto o no resuelto
}
