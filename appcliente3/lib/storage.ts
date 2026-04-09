import type { User, Client, Vehicle, ServiceOrder, StateHistory, Revenue, Expense, Report } from './types';

// LocalStorage keys
const KEYS = {
  USERS: 'workshop_users',
  CLIENTS: 'workshop_clients', // Added clients storage key
  VEHICLES: 'workshop_vehicles',
  SERVICE_ORDERS: 'workshop_service_orders',
  STATE_HISTORY: 'workshop_state_history',
  CURRENT_USER: 'workshop_current_user',
  REVENUES: 'workshop_revenues', // Added revenues storage key
  EXPENSES: 'workshop_expenses', // Added expenses storage key
  REPORTS: 'workshop_reports', // Added reports storage key
} as const;

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// User functions
export function getUsers(): User[] {
  return getFromStorage<User>(KEYS.USERS);
}

export function saveUser(user: User): void {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  saveToStorage(KEYS.USERS, users);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email === email);
}

// Current user session
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}

// Client functions for customer registration
export function getClients(): Client[] {
  return getFromStorage<Client>(KEYS.CLIENTS);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const existingIndex = clients.findIndex(c => c.id === client.id);
  if (existingIndex >= 0) {
    clients[existingIndex] = { ...client, updatedAt: new Date().toISOString() };
  } else {
    clients.push(client);
  }
  saveToStorage(KEYS.CLIENTS, clients);
}

export function getClientById(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function getClientByIdNumber(idNumber: string): Client | undefined {
  return getClients().find(c => c.idNumber === idNumber);
}

export function getClientByEmail(email: string): Client | undefined {
  return getClients().find(c => c.email.toLowerCase() === email.toLowerCase());
}

// Vehicle functions
export function getVehicles(): Vehicle[] {
  return getFromStorage<Vehicle>(KEYS.VEHICLES);
}

export function saveVehicle(vehicle: Vehicle): void {
  const vehicles = getVehicles();
  const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
  if (existingIndex >= 0) {
    vehicles[existingIndex] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  saveToStorage(KEYS.VEHICLES, vehicles);
}

export function getVehiclesByClientId(clientId: string): Vehicle[] {
  return getVehicles().filter(v => v.clientId === clientId);
}

export function getVehicleByLicensePlate(licensePlate: string): Vehicle | undefined {
  return getVehicles().find(v => v.licensePlate.toLowerCase() === licensePlate.toLowerCase());
}

// Service Order functions
export function getServiceOrders(): ServiceOrder[] {
  return getFromStorage<ServiceOrder>(KEYS.SERVICE_ORDERS);
}

export function saveServiceOrder(order: ServiceOrder): void {
  const orders = getServiceOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  saveToStorage(KEYS.SERVICE_ORDERS, orders);
}

export function getServiceOrderById(id: string): ServiceOrder | undefined {
  return getServiceOrders().find(o => o.id === id);
}

export function getServiceOrderByPublicToken(token: string): ServiceOrder | undefined {
  return getServiceOrders().find(o => o.publicToken === token);
}

export function getServiceOrdersByClientId(clientId: string): ServiceOrder[] {
  return getServiceOrders().filter(o => o.clientId === clientId);
}

export function getServiceOrdersByTechnicianId(technicianId: string): ServiceOrder[] {
  return getServiceOrders().filter(o => o.technicianId === technicianId);
}

export function getServiceOrdersByVehicleId(vehicleId: string): ServiceOrder[] {
  return getServiceOrders().filter(o => o.vehicleId === vehicleId);
}

// State History functions
export function getStateHistory(): StateHistory[] {
  return getFromStorage<StateHistory>(KEYS.STATE_HISTORY);
}

export function saveStateHistory(history: StateHistory): void {
  const histories = getStateHistory();
  histories.push(history);
  saveToStorage(KEYS.STATE_HISTORY, histories);
}

export function getStateHistoryByOrderId(orderId: string): StateHistory[] {
  return getStateHistory().filter(h => h.serviceOrderId === orderId);
}

export function createStateHistory(history: Omit<StateHistory, 'id' | 'changedAt'>): StateHistory {
  const newHistory: StateHistory = {
    ...history,
    id: Date.now().toString(),
    changedAt: new Date().toISOString(),
  };
  saveStateHistory(newHistory);
  return newHistory;
}

// Revenue functions for tracking income from delivered orders
export function getRevenues(): Revenue[] {
  return getFromStorage<Revenue>(KEYS.REVENUES);
}

export function saveRevenue(revenue: Revenue): void {
  const revenues = getRevenues();
  revenues.push(revenue);
  saveToStorage(KEYS.REVENUES, revenues);
}

export function createRevenue(revenue: Omit<Revenue, 'id' | 'created_at'>): Revenue {
  const newRevenue: Revenue = {
    ...revenue,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };
  saveRevenue(newRevenue);
  return newRevenue;
}

// Initialize demo data
export function initializeDemoData(): void {
  const users = getUsers();
  if (users.length === 0) {
    // Create demo users
    const demoUsers: User[] = [
      {
        id: '1',
        email: 'admin@taller.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'cliente@ejemplo.com',
        password: 'cliente123',
        name: 'Juan Pérez',
        role: 'client',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        email: 'tecnico@taller.com',
        password: 'tecnico123',
        name: 'Carlos Mecánico',
        role: 'technician',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        email: 'calidad@taller.com',
        password: 'calidad123',
        name: 'Control de Calidad',
        role: 'quality-control',
        createdAt: new Date().toISOString(),
      },
    ];
    saveToStorage(KEYS.USERS, demoUsers);
  }
}

export function updateQuotation(serviceOrderId: string, quotation: any): void {
  const order = getServiceOrderById(serviceOrderId);
  if (order) {
    order.quotation = quotation;
    saveServiceOrder(order);
  }
}

async function convertBlobToBase64(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[v0] Error converting blob to base64:', error);
    return blobUrl;
  }
}

export { convertBlobToBase64 };

export async function saveServiceOrderWithPhotos(order: ServiceOrder): Promise<void> {
  // Importar función de compresión
  const { compressBlobToBase64 } = await import('./image-compression');
  
  // Convert blob URLs to base64 comprimido para persistencia
  const intakePhotosBase64 = await Promise.all(
    order.intakePhotos.map(async (photo) => {
      if (photo.startsWith('blob:')) {
        return await compressBlobToBase64(photo, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeKB: 500,
        });
      }
      // Si ya es base64, retornarlo directamente
      return photo;
    })
  );
  
  const servicePhotosBase64 = await Promise.all(
    order.servicePhotos.map(async (photo) => {
      if (photo.startsWith('blob:')) {
        return await compressBlobToBase64(photo, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeKB: 500,
        });
      }
      // Si ya es base64, retornarlo directamente
      return photo;
    })
  );

  const orderToSave = {
    ...order,
    intakePhotos: intakePhotosBase64,
    servicePhotos: servicePhotosBase64,
  };

  saveServiceOrder(orderToSave);
}

export function deleteServiceOrder(id: string): void {
  const orders = getServiceOrders();
  const filtered = orders.filter(o => o.id !== id);
  saveToStorage(KEYS.SERVICE_ORDERS, filtered);
  
  // Also delete related state history
  const histories = getStateHistory();
  const filteredHistories = histories.filter(h => h.serviceOrderId !== id);
  saveToStorage(KEYS.STATE_HISTORY, filteredHistories);
}

// Expense functions
export function getExpenses(): Expense[] {
  return getFromStorage<Expense>(KEYS.EXPENSES);
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  expenses.push(expense);
  saveToStorage(KEYS.EXPENSES, expenses);
}

export function createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Expense {
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };
  saveExpense(newExpense);
  return newExpense;
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  saveToStorage(KEYS.EXPENSES, filtered);
}

// Report functions
export function getReports(): Report[] {
  return getFromStorage<Report>(KEYS.REPORTS);
}

export function saveReport(report: Report): void {
  const reports = getReports();
  reports.push(report);
  saveToStorage(KEYS.REPORTS, reports);
}

export function createReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
  const newReport: Report = {
    ...report,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  saveReport(newReport);
  return newReport;
}

export function deleteReport(id: string): void {
  const reports = getReports();
  const filtered = reports.filter(r => r.id !== id);
  saveToStorage(KEYS.REPORTS, filtered);
}

export function updateReport(id: string, updates: Partial<Report>): void {
  const reports = getReports();
  const updated = reports.map(r => r.id === id ? { ...r, ...updates } : r);
  saveToStorage(KEYS.REPORTS, updated);
}
