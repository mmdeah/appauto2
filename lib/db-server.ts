// Server-only database functions that use Supabase
// This file should NEVER be imported in client components
import { createClient } from "./supabase/server"
import type {
  User,
  Client,
  Vehicle,
  ServiceOrder,
  StateHistory,
  Expense,
  Revenue,
  Report,
} from "./types"

// Server-only functions that use Supabase directly
export async function getUsersServer(): Promise<User[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getClientsServer(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getVehiclesServer(): Promise<Vehicle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getServiceOrdersServer(): Promise<ServiceOrder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("service_orders").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getExpensesServer(): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getRevenuesServer(): Promise<Revenue[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("revenues").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export async function getReportsServer(): Promise<Report[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}




