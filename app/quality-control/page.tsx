"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getServiceOrders, getVehicles, getClients } from "@/lib/db"
import type { ServiceOrder, Vehicle, Client } from "@/lib/types"
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from "@/lib/utils-service"

export default function QualityControlPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({})
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersData, vehiclesData, clientsData] = await Promise.all([
        getServiceOrders(),
        getVehicles(),
        getClients(),
      ])

      // Filtrar solo órdenes en estado "quality"
      const qualityOrders = ordersData.filter((order) => order.state === "quality")
      setOrders(qualityOrders)

      // Crear mapas para acceso rápido
      const vehiclesMap: Record<string, Vehicle> = {}
      vehiclesData.forEach((v) => {
        vehiclesMap[v.id] = v
      })
      setVehicles(vehiclesMap)

      const clientsMap: Record<string, Client> = {}
      clientsData.forEach((c) => {
        clientsMap[c.id] = c
      })
      setClients(clientsMap)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOrderStatus = (order: ServiceOrder) => {
    if (order.qualityControlCheck) {
      return {
        label: "Completado",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: CheckCircle2,
      }
    }
    return {
      label: "Pendiente",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      icon: Clock,
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["quality-control"]}>
        <DashboardLayout title="Control de Calidad">
          <div className="text-center py-12 text-muted-foreground">Cargando órdenes...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["quality-control"]}>
      <DashboardLayout title="Control de Calidad">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Control de Calidad</h1>
              <p className="text-muted-foreground mt-1">
                Verifica que los vehículos cumplan con los estándares de calidad antes de entregarlos
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total de Órdenes</p>
                    <h3 className="text-3xl font-bold">{orders.length}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 ml-4">
                    <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pendientes</p>
                    <h3 className="text-3xl font-bold">
                      {orders.filter((o) => !o.qualityControlCheck).length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 ml-4">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Completadas</p>
                    <h3 className="text-3xl font-bold">
                      {orders.filter((o) => o.qualityControlCheck).length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 ml-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes en Control de Calidad</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes en control de calidad en este momento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const vehicle = vehicles[order.vehicleId]
                    const client = clients[order.clientId]
                    const status = getOrderStatus(order)

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Car className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {vehicle?.brand} {vehicle?.model}
                              </h3>
                              <Badge className={SERVICE_STATE_COLORS[order.state]}>
                                {SERVICE_STATE_LABELS[order.state]}
                              </Badge>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Placa: {vehicle?.licensePlate} | Cliente: {client?.name}
                            </p>
                            {order.orderNumber && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Orden #{order.orderNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link href={`/quality-control/orders/${order.id}`}>
                          <Button variant={order.qualityControlCheck ? "outline" : "default"}>
                            {order.qualityControlCheck ? "Ver Formulario" : "Completar Control"}
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}


