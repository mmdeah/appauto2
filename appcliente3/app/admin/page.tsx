"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Car, Users, Wrench, TrendingUp, DollarSign, TrendingDown, Search, Filter, AlertCircle, CheckCircle2, XCircle, User, Calendar, ListChecks, CheckCircle, Clock, Trash2, Package, Star, FileText } from "lucide-react"
import { getServiceOrders, getVehicles, getUsers, getClients, getDashboardStats, getReports, updateReport, deleteReport, updateServiceOrder, createStateHistory, getRatings, updateRating, getStateHistoryByOrderId } from "@/lib/db"
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS, formatCurrency } from "@/lib/utils-service"
import type { ServiceOrder, Vehicle, User, Client, Report, ServiceState } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { getServiceOrderById, createRevenue, deleteVehicle, deleteServiceOrder, createArchivedOrder } from "@/lib/db"
import { printInvoice } from "@/lib/invoice-generator"
import { generateOrderSummaryHTML } from "@/lib/order-summary-html"

export default function AdminPage() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [stats, setStats] = useState({
    vehiclesServed: 0,
    averageTicket: 0,
    totalSales: 0,
    totalExpenses: 0,
    profit: 0,
    activeOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [deliveredSearch, setDeliveredSearch] = useState("")
  const [reportFilter, setReportFilter] = useState<"all" | "resolved" | "unresolved">("all")
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ServiceOrder | null>(null)
  const [deliveryOrderDetails, setDeliveryOrderDetails] = useState<{ order: ServiceOrder | null; vehicle: Vehicle | null; client: Client | null; technician: User | null }>({
    order: null,
    vehicle: null,
    client: null,
    technician: null
  })
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
            const [orders, allVehicles, allUsers, allClients, dashboardStats, allReports, allRatings] = await Promise.all([
        getServiceOrders().catch((err) => {
          console.error("[v0] Error loading orders:", err)
          return []
        }),
        getVehicles().catch((err) => {
          console.error("[v0] Error loading vehicles:", err)
          return []
        }),
        getUsers().catch((err) => {
          console.error("[v0] Error loading users:", err)
          return []
        }),
        getClients().catch((err) => {
          console.error("[v0] Error loading clients:", err)
          return []
        }),
        getDashboardStats().catch((err) => {
          console.error("[v0] Error loading stats:", err)
          return {
            vehiclesServed: 0,
            averageTicket: 0,
            totalSales: 0,
            totalExpenses: 0,
            profit: 0,
            activeOrders: 0,
          }
        }),
              getReports().catch((err) => {
                console.error("[v0] Error loading reports:", err)
                return []
              }),
              getRatings().catch((err) => {
                console.error("[v0] Error loading ratings:", err)
                return []
              }),
            ])

      setServiceOrders(orders)
      setVehicles(allVehicles)
      setClients(allClients)
            setTechnicians(allUsers.filter((u) => u.role === "technician"))
            setStats(dashboardStats)
            setReports(allReports)
            setRatings(allRatings)
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
      setServiceOrders([])
      setVehicles([])
      setClients([])
      setTechnicians([])
      setStats({
        vehiclesServed: 0,
        averageTicket: 0,
        totalSales: 0,
        totalExpenses: 0,
        profit: 0,
        activeOrders: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find((v) => v.id === vehicleId)
  }

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || "Desconocido"
  }

  const getTechnicianName = (technicianId?: string) => {
    if (!technicianId) return "Sin asignar"
    return technicians.find((t) => t.id === technicianId)?.name || "Desconocido"
  }

  const handleDragStart = (orderId: string) => {
    setDraggedOrderId(orderId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("opacity-50")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
  }

  const handleDrop = async (e: React.DragEvent, targetState: ServiceState) => {
    e.preventDefault()
    e.currentTarget.classList.remove("opacity-50")

    if (!draggedOrderId || !user) return

    const order = serviceOrders.find((o) => o.id === draggedOrderId)
    if (!order || order.state === targetState) {
      setDraggedOrderId(null)
      return
    }

    try {
      // Crear historial de estado
      await createStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: targetState,
        changedBy: user.id,
        notes: `Estado: ${SERVICE_STATE_LABELS[targetState]}`,
      })

      // Actualizar orden
      await updateServiceOrder(order.id, {
        state: targetState,
      })

      // Recargar datos
      await loadData()
    } catch (error) {
      console.error("[v0] Error moving order:", error)
    } finally {
      setDraggedOrderId(null)
    }
  }

  const handleOpenDeliveryDialog = async (order: ServiceOrder) => {
    setSelectedOrderForDelivery(order)
    
    // Cargar detalles completos de la orden
    try {
      const fullOrder = await getServiceOrderById(order.id)
      const vehicle = vehicles.find(v => v.id === order.vehicleId) || null
      const client = clients.find(c => c.id === order.clientId) || null
      const technician = order.technicianId ? technicians.find(t => t.id === order.technicianId) || null : null
      
      setDeliveryOrderDetails({
        order: fullOrder,
        vehicle,
        client,
        technician
      })
      setDeliveryDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error loading order details:", error)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!selectedOrderForDelivery || !user || !deliveryOrderDetails.order) return

    try {
      // Crear historial de estado
      await createStateHistory({
        serviceOrderId: selectedOrderForDelivery.id,
        previousState: selectedOrderForDelivery.state,
        newState: "delivered",
        changedBy: user.id,
        notes: "Estado: Entregado",
      })

      // Registrar ganancia si aplica
      if (deliveryOrderDetails.order.quotation && deliveryOrderDetails.order.quotation.total > 0) {
        await createRevenue({
          serviceOrderId: selectedOrderForDelivery.id,
          amount: deliveryOrderDetails.order.quotation.total,
          date: new Date().toISOString(),
          description: `Orden ${deliveryOrderDetails.order.orderNumber || selectedOrderForDelivery.id.slice(0, 8)} - ${deliveryOrderDetails.vehicle ? `${deliveryOrderDetails.vehicle.brand} ${deliveryOrderDetails.vehicle.model}` : "Vehículo"}`,
        })
      }

      // Actualizar orden - eliminar fotos para optimizar espacio, mantener solo información de texto
      await updateServiceOrder(selectedOrderForDelivery.id, {
        state: "delivered",
        deliveredAt: new Date().toISOString(),
        intakePhotos: [], // Eliminar fotos de ingreso
        servicePhotos: [], // Eliminar fotos de servicio
      })

      // Obtener historial de estados para el resumen
      const orderHistory = await getStateHistoryByOrderId(selectedOrderForDelivery.id)

      // Generar HTML del resumen de la orden (misma plantilla que antes se enviaba por email)
      if (
        deliveryOrderDetails.order &&
        deliveryOrderDetails.client &&
        deliveryOrderDetails.vehicle
      ) {
        const summaryHtml = generateOrderSummaryHTML(
          deliveryOrderDetails.order,
          deliveryOrderDetails.client,
          deliveryOrderDetails.vehicle,
          deliveryOrderDetails.technician,
          orderHistory,
        )

        const licensePlate =
          deliveryOrderDetails.vehicle.licensePlate ||
          `Orden_${deliveryOrderDetails.order.orderNumber || selectedOrderForDelivery.id.slice(0, 8)}`

        // Abrir ventana de impresión / guardar como PDF
        printInvoice(summaryHtml, licensePlate, "invoice")
      }

      setDeliveryDialogOpen(false)
      setSelectedOrderForDelivery(null)
      setDeliveryOrderDetails({ order: null, vehicle: null, client: null, technician: null })
      await loadData()
    } catch (error) {
      console.error("[v0] Error confirming delivery:", error)
      alert("Error al procesar la entrega. Por favor intente nuevamente.")
    }
  }

  const activeOrders = serviceOrders.filter((order) => order.state !== "delivered")
  const deliveredOrders = serviceOrders.filter((order) => order.state === "delivered")

  const filteredDeliveredOrders = deliveredOrders.filter((order) => {
    if (!deliveredSearch.trim()) return true
    const searchTerm = deliveredSearch.toLowerCase()
    const vehicle = getVehicleInfo(order.vehicleId)
    const orderNumber = order.orderNumber || order.id.slice(0, 8)

    return (
      orderNumber.toLowerCase().includes(searchTerm) ||
      vehicle?.licensePlate.toLowerCase().includes(searchTerm) ||
      vehicle?.brand.toLowerCase().includes(searchTerm) ||
      vehicle?.model.toLowerCase().includes(searchTerm) ||
      getClientName(order.clientId).toLowerCase().includes(searchTerm)
    )
  })

  const statsCards = [
    {
      title: "Vehículos Atendidos",
      value: stats.vehiclesServed,
      icon: Car,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(stats.averageTicket),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Ventas",
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Gastos",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: "Ganancia",
      value: formatCurrency(stats.profit),
      icon: TrendingUp,
      color: stats.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      bgColor: stats.profit >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: "Órdenes Activas",
      value: stats.activeOrders,
      icon: Wrench,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Panel de Administración">
          <div className="text-center py-12 text-muted-foreground">Cargando dashboard...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Panel de Administración">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold">
                        {typeof stat.value === "string" ? stat.value : stat.value.toLocaleString()}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor} ml-4`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-sm">
              <Link href="/admin/new-order">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden de Servicio
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/quick-quotation">
                <FileText className="h-4 w-4 mr-2" />
                Cotización Rápida
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/invoice">
                <FileText className="h-4 w-4 mr-2" />
                Crear Cuenta de Cobro
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/vehicles">
                <Car className="h-4 w-4 mr-2" />
                Gestionar Vehículos
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/statistics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Estadísticas
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="shadow-sm">
              <Link href="/admin/reports">
                <FileText className="h-4 w-4 mr-2" />
                Reportes
              </Link>
            </Button>
          </div>

          {/* Recent Service Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Servicio</CardTitle>
              <CardDescription>Gestione las órdenes activas y entregadas</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay órdenes de servicio registradas</p>
                  <Button asChild className="mt-4">
                    <Link href="/admin/new-order">Crear Primera Orden</Link>
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Activas ({activeOrders.length})</TabsTrigger>
                    <TabsTrigger value="delivered">Entregadas ({deliveredOrders.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-4">
                    {activeOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No hay órdenes activas</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                        {(["reception", "quotation", "process", "quality"] as const).map((state) => {
                          const stateOrders = activeOrders.filter((o) => o.state === state)
                          return (
                            <div
                              key={state}
                              className="flex flex-col min-w-[280px]"
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, state)}
                            >
                              <div className={`p-3 rounded-t-lg ${SERVICE_STATE_COLORS[state]} mb-2`}>
                                <h3 className="font-semibold text-sm">
                                  {SERVICE_STATE_LABELS[state]} ({stateOrders.length})
                                </h3>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1 min-h-[200px]">
                                {stateOrders.length === 0 ? (
                                  <div className="p-6 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/30">
                                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>Arrastre órdenes aquí</p>
                                  </div>
                                ) : (
                                  stateOrders
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map((order) => {
                                      const vehicle = getVehicleInfo(order.vehicleId)
                                      const isDragging = draggedOrderId === order.id
                                      return (
                                        <div
                                          key={order.id}
                                          draggable
                                          onDragStart={() => handleDragStart(order.id)}
                                          className={`cursor-move ${
                                            isDragging ? "opacity-50" : ""
                                          }`}
                                        >
                                          <div className="p-3 bg-card border rounded-lg hover:shadow-md transition-all">
                                            <Link
                                              href={`/admin/orders/${order.id}`}
                                              className="block"
                                              onClick={(e) => {
                                                // Prevenir navegación si estamos arrastrando o haciendo click en el botón
                                                if (draggedOrderId) {
                                                  e.preventDefault()
                                                }
                                              }}
                                            >
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                  <h4 className="font-semibold text-base">
                                                    {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                                  </h4>
                                                </div>
                                              {vehicle && (
                                                <div className="text-sm text-muted-foreground">
                                                  <p className="font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                                                  <p className="flex items-center gap-1">
                                                    <span>{vehicle.licensePlate}</span>
                                                  </p>
                                                </div>
                                              )}
                                              <p className="text-sm text-muted-foreground line-clamp-2">
                                                {order.description}
                                              </p>
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
                                                <User className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{getClientName(order.clientId)}</span>
                                              </div>
                                              {order.technicianId && (
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                  <Wrench className="h-4 w-4 shrink-0" />
                                                  <span className="truncate">{getTechnicianName(order.technicianId)}</span>
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-4 w-4 shrink-0" />
                                                <span>
                                                  {new Date(order.createdAt).toLocaleDateString("es-ES", {
                                                    month: "short",
                                                    day: "numeric",
                                                  })}
                                                </span>
                                              </div>
                                              {order.services && order.services.length > 0 && (
                                                <div className="pt-1.5 border-t space-y-1">
                                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <ListChecks className="h-4 w-4 shrink-0" />
                                                    <span className="font-medium">
                                                      Servicios ({order.services.filter(s => s.completed).length}/{order.services.length})
                                                    </span>
                                                  </div>
                                                  <div className="space-y-0.5">
                                                    {order.services.slice(0, 2).map((service) => (
                                                      <div key={service.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        {service.completed ? (
                                                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                                                        ) : (
                                                          <Clock className="h-3 w-3 shrink-0" />
                                                        )}
                                                        <span className="truncate line-clamp-1">
                                                          {service.description}
                                                        </span>
                                                      </div>
                                                    ))}
                                                    {order.services.length > 2 && (
                                                      <p className="text-xs text-muted-foreground pl-4">
                                                        +{order.services.length - 2} más
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            </Link>
                                            {order.state === "quality" && order.qualityControlCheck && (
                                              <div className="mt-2 pt-2 border-t">
                                                <Button
                                                  size="sm"
                                                  className="w-full"
                                                  onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleOpenDeliveryDialog(order)
                                                  }}
                                                >
                                                  <Package className="h-4 w-4 mr-2" />
                                                  Entregar
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="delivered" className="space-y-3 mt-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por orden, placa, vehículo o cliente..."
                          value={deliveredSearch}
                          onChange={(e) => setDeliveredSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {filteredDeliveredOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">
                          {deliveredSearch.trim() ? "No se encontraron resultados" : "No hay órdenes entregadas"}
                        </p>
                      </div>
                    ) : (
                      filteredDeliveredOrders
                        .sort(
                          (a, b) =>
                            new Date(b.deliveredAt || b.updatedAt).getTime() -
                            new Date(a.deliveredAt || a.updatedAt).getTime(),
                        )
                        .map((order) => {
                          const vehicle = getVehicleInfo(order.vehicleId)
                          return (
                            <Link
                              key={order.id}
                              href={`/admin/orders/${order.id}`}
                              className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold">{order.orderNumber || `#${order.id.slice(0, 8)}`}</h4>
                                    <span className="text-sm text-muted-foreground">
                                      {vehicle
                                        ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`
                                        : "Vehículo no encontrado"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{order.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>Cliente: {getClientName(order.clientId)}</span>
                                    <span>•</span>
                                    <span>Técnico: {getTechnicianName(order.technicianId)}</span>
                                    {order.deliveredAt && (
                                      <>
                                        <span>•</span>
                                        <span>
                                          Entregado: {new Date(order.deliveredAt).toLocaleDateString("es-ES")}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge className={SERVICE_STATE_COLORS[order.state]}>
                                  {SERVICE_STATE_LABELS[order.state]}
                                </Badge>
                              </div>
                            </Link>
                          )
                        })
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Reportes Técnicos
                  </CardTitle>
                  <CardDescription>Reportes de diagnóstico enviados por los técnicos</CardDescription>
                </div>
                {reports.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={reportFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportFilter("all")}
                    >
                      Todos ({reports.length})
                    </Button>
                    <Button
                      variant={reportFilter === "unresolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportFilter("unresolved")}
                      className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                    >
                      No Resueltos ({reports.filter((r) => !r.resolved).length})
                    </Button>
                    <Button
                      variant={reportFilter === "resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportFilter("resolved")}
                      className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                    >
                      Resueltos ({reports.filter((r) => r.resolved).length})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay reportes técnicos registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {reports
                    .filter((report) => {
                      if (reportFilter === "resolved") return report.resolved
                      if (reportFilter === "unresolved") return !report.resolved
                      return true
                    })
                    .sort((a, b) => {
                      // Ordenar: no resueltos primero, luego por fecha
                      if (a.resolved !== b.resolved) {
                        return a.resolved ? 1 : -1
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .map((report) => {
                      // Asegurar que resolved sea un booleano
                      const isResolved = Boolean(report.resolved)
                      return (
                        <Card
                          key={report.id}
                          className={`hover:shadow-md transition-all overflow-hidden ${
                            isResolved
                              ? "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-300 dark:border-blue-700"
                              : "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border border-yellow-300 dark:border-yellow-700"
                          }`}
                        >
                          <div
                            className={`h-1 w-full ${
                              isResolved ? "bg-blue-500 dark:bg-blue-400" : "bg-yellow-500 dark:bg-yellow-400"
                            }`}
                          />
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <h4
                                      className={`font-semibold text-sm truncate ${
                                        isResolved
                                          ? "text-blue-900 dark:text-blue-100"
                                          : "text-yellow-900 dark:text-yellow-100"
                                      }`}
                                    >
                                      {report.licensePlate}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${
                                        isResolved
                                          ? "border-blue-400 text-blue-700 dark:border-blue-600 dark:text-blue-300"
                                          : "border-yellow-400 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300"
                                      }`}
                                    >
                                      {report.category}
                                    </Badge>
                                    <div
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                        isResolved
                                          ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                                          : "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100"
                                      }`}
                                    >
                                      {isResolved ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )}
                                      <span className="text-[10px] font-semibold">
                                        {isResolved ? "OK" : "PEND"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        if (!isResolved) {
                                          // Marcar como resuelto
                                          await updateReport(report.id, { resolved: true })
                                          // Esperar un momento y luego eliminar automáticamente
                                          setTimeout(async () => {
                                            try {
                                              await deleteReport(report.id)
                                              await loadData()
                                            } catch (error) {
                                              console.error("[v0] Error deleting report:", error)
                                            }
                                          }, 500)
                                        } else {
                                          // Desmarcar como resuelto
                                          await updateReport(report.id, { resolved: false })
                                          await loadData()
                                        }
                                      } catch (error) {
                                        console.error("[v0] Error updating report:", error)
                                      }
                                    }}
                                    className={`h-7 w-7 p-0 shrink-0 rounded-full ${
                                      isResolved
                                        ? "hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                        : "hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                    }`}
                                    title={isResolved ? "Marcar como No Resuelto" : "Marcar como Resuelto"}
                                  >
                                    {isResolved ? (
                                      <XCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString("es-ES", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <div className="pt-1.5 border-t border-border/50">
                                <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                                  {report.text}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calificaciones Pendientes */}
          {ratings.filter(r => !r.resolved).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Calificaciones Pendientes de Revisar
                </CardTitle>
                <CardDescription>Puntos de mejora identificados por los clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ratings
                    .filter(r => !r.resolved)
                    .map((rating) => {
                      const order = serviceOrders.find(o => o.id === rating.serviceOrderId);
                      const vehicle = order ? vehicles.find(v => v.id === order.vehicleId) : null;
                      const client = order ? clients.find(c => c.id === order.clientId) : null;
                      const avgRating = (
                        rating.ratings.serviceQuality +
                        rating.ratings.timeliness +
                        rating.ratings.communication +
                        rating.ratings.cleanliness +
                        rating.ratings.overall
                      ) / 5;

                      return (
                        <div key={rating.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">
                                  {vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}` : 'Orden sin vehículo'}
                                </h4>
                                {order && (
                                  <Badge variant="outline">
                                    Orden #{order.orderNumber || order.id.slice(0, 8)}
                                  </Badge>
                                )}
                              </div>
                              {client && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Cliente: {client.name}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Calidad:</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= rating.ratings.serviceQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Puntualidad:</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= rating.ratings.timeliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Comunicación:</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= rating.ratings.communication ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Limpieza:</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= rating.ratings.cleanliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Promedio:</span>
                                  <span className="font-semibold ml-1">{avgRating.toFixed(1)}/5</span>
                                </div>
                              </div>
                              {rating.comments && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                  <p className="text-sm font-medium mb-1">Comentarios del Cliente:</p>
                                  <p className="text-sm text-muted-foreground">{rating.comments}</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Calificado el: {new Date(rating.createdAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await updateRating(rating.id, { resolved: true });
                                  await loadData();
                                } catch (error) {
                                  console.error('[v0] Error resolving rating:', error);
                                }
                              }}
                            >
                              Marcar como Resuelto
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>

      {/* Diálogo de Confirmación de Entrega */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Entrega de Vehículo</DialogTitle>
            <DialogDescription>
              Revisa los detalles de la orden antes de confirmar la entrega. Se enviará un correo al cliente con toda la información.
            </DialogDescription>
          </DialogHeader>

          {deliveryOrderDetails.order && deliveryOrderDetails.vehicle && deliveryOrderDetails.client ? (
            <div className="space-y-6 py-4">
              {/* Información de la Orden */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Información de la Orden</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Orden</p>
                      <p className="font-medium">{deliveryOrderDetails.order.orderNumber || `#${deliveryOrderDetails.order.id.slice(0, 8)}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado Actual</p>
                      <Badge className={SERVICE_STATE_COLORS[deliveryOrderDetails.order.state]}>
                        {SERVICE_STATE_LABELS[deliveryOrderDetails.order.state]}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Descripción</p>
                      <p className="font-medium">{deliveryOrderDetails.order.description}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información del Cliente */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Datos del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{deliveryOrderDetails.client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{deliveryOrderDetails.client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{deliveryOrderDetails.client.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cédula</p>
                      <p className="font-medium">{deliveryOrderDetails.client.idNumber}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información del Vehículo */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Datos del Vehículo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Marca</p>
                      <p className="font-medium">{deliveryOrderDetails.vehicle.brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo</p>
                      <p className="font-medium">{deliveryOrderDetails.vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Placa</p>
                      <p className="font-medium">{deliveryOrderDetails.vehicle.licensePlate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Año</p>
                      <p className="font-medium">{deliveryOrderDetails.vehicle.year}</p>
                    </div>
                  </div>
                </div>

                {/* Cotización */}
                {deliveryOrderDetails.order.quotation && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Cotización</h3>
                      <div className="space-y-2">
                        {deliveryOrderDetails.order.quotation.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.description}</span>
                            <span className="font-medium">{formatCurrency(item.total)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(deliveryOrderDetails.order.quotation.total)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Fotos */}
                {(deliveryOrderDetails.order.intakePhotos?.length > 0 || deliveryOrderDetails.order.servicePhotos?.length > 0) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Fotos del Servicio</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {deliveryOrderDetails.order.intakePhotos?.map((photo, idx) => (
                          <img key={`intake-${idx}`} src={photo} alt={`Foto ingreso ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                        ))}
                        {deliveryOrderDetails.order.servicePhotos?.map((photo, idx) => (
                          <img key={`service-${idx}`} src={photo} alt={`Foto servicio ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Cargando detalles de la orden...</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelivery} disabled={!deliveryOrderDetails.order}>
              Confirmar Entrega y Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
