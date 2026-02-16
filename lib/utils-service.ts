import type { ServiceState } from "./types"

export const SERVICE_STATE_LABELS: Record<ServiceState, string> = {
  reception: "Recepción",
  quotation: "Cotización",
  process: "Proceso",
  quality: "Calidad",
}

export const SERVICE_STATE_COLORS: Record<ServiceState, string> = {
  reception: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  quotation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  process: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  quality: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function generatePublicToken(): string {
  // Genera un token único y seguro para URLs públicas
  // Usa crypto.randomUUID si está disponible, sino genera uno manual
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  // Fallback: genera un token largo y único
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export function generateOrderNumber(licensePlate: string): string {
  // Extraer solo los números de la placa
  const plateNumbers = licensePlate.replace(/\D/g, "")
  
  // Si no hay números en la placa, usar "000"
  const plateDigits = plateNumbers || "000"
  
  // Obtener contador específico para esta placa desde localStorage
  const counterKey = `workshop_order_counter_${plateDigits}`
  let counter = 1

  if (typeof window !== "undefined") {
    const storedCounter = localStorage.getItem(counterKey)
    if (storedCounter) {
      counter = Number.parseInt(storedCounter, 10) + 1
    }
    localStorage.setItem(counterKey, counter.toString())
  }

  // Formato: SD + números de placa + contador
  return `SD${plateDigits}${counter}`
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} COP`
}

export const SERVICE_STATE_ORDER: ServiceState[] = ["reception", "quotation", "process", "quality"]

export function getNextState(currentState: ServiceState): ServiceState | null {
  const currentIndex = SERVICE_STATE_ORDER.indexOf(currentState)
  if (currentIndex === -1 || currentIndex === SERVICE_STATE_ORDER.length - 1) {
    return null
  }
  return SERVICE_STATE_ORDER[currentIndex + 1]
}

export function getPreviousState(currentState: ServiceState): ServiceState | null {
  const currentIndex = SERVICE_STATE_ORDER.indexOf(currentState)
  if (currentIndex === -1 || currentIndex === 0) {
    return null
  }
  return SERVICE_STATE_ORDER[currentIndex - 1]
}
