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

export interface ServiceRating {
  id: string
  serviceOrderId: string
  clientId: string
  ratings: {
    serviceQuality: number // 1-5
    timeliness: number // 1-5
    communication: number // 1-5
    cleanliness: number // 1-5
    overall: number // 1-5
  }
  comments?: string
  createdAt: string
  resolved?: boolean // Si el admin ya resolvió los puntos de mejora
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
  rating?: ServiceRating // Calificación del cliente
  publicToken?: string // Token único para URL pública de visualización
  whatsappSent?: boolean // Indica si ya se envió el mensaje de WhatsApp inicial
  adminObservation?: string // Observación del administrador visible para el cliente
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
  total: number // base amount (cantidad * precio unitario)
  includesTax?: boolean // Si este ítem tiene IVA (19%). Por defecto true.
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

export interface ReviewReport {
  id: string
  reportId: string // ID del reporte del técnico
  licensePlate: string // Placa del vehículo
  category: string // Categoría de la revisión del admin
  text: string // Texto de la revisión del admin
  reviewedBy: string // ID del admin que hizo la revisión
  createdAt: string
}

export interface ArchivedOrder {
  id: string
  archivedAt: string // Fecha de archivado
  originalOrderId: string // ID de la orden original
  orderNumber?: string // Número de orden legible
  
  // Datos del cliente (completos, sin referencias)
  client: {
    name: string
    idNumber: string
    phone: string
    email: string
    address?: string
  }
  
  // Datos del vehículo (completos, sin referencias)
  vehicle: {
    brand: string
    model: string
    year: number
    licensePlate: string
    vin?: string
    color?: string
  }
  
  // Servicios realizados
  services: ServiceItem[]
  
  // Cotización final
  quotation?: Quotation
  
  // Información adicional
  description: string
  diagnosis?: string
  estimatedCost?: number
  finalCost?: number
  technicianName?: string
  
  // Fechas
  createdAt: string // Fecha original de creación
  deliveredAt: string // Fecha de entrega
}
