"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Search, FileText, Calendar, User, Car, DollarSign } from "lucide-react"
import Link from "next/link"
import { getArchivedOrders } from "@/lib/db"
import { formatCurrency } from "@/lib/utils-service"
import type { ArchivedOrder } from "@/lib/types"

export default function ArchivedOrdersPage() {
  const [archivedOrders, setArchivedOrders] = useState<ArchivedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ArchivedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ArchivedOrder | null>(null)

  useEffect(() => {
    loadArchivedOrders()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(archivedOrders)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = archivedOrders.filter(
        (order) =>
          order.vehicle.licensePlate.toLowerCase().includes(term) ||
          order.client.name.toLowerCase().includes(term) ||
          order.client.idNumber.toLowerCase().includes(term) ||
          order.orderNumber?.toLowerCase().includes(term) ||
          `${order.vehicle.brand} ${order.vehicle.model}`.toLowerCase().includes(term)
      )
      setFilteredOrders(filtered)
    }
  }, [searchTerm, archivedOrders])

  const loadArchivedOrders = async () => {
    setLoading(true)
    try {
      const orders = await getArchivedOrders()
      // Ordenar por fecha de entrega (más recientes primero)
      const sorted = orders.sort(
        (a, b) => new Date(b.deliveredAt).getTime() - new Date(a.deliveredAt).getTime()
      )
      setArchivedOrders(sorted)
      setFilteredOrders(sorted)
    } catch (error) {
      console.error("[v0] Error loading archived orders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Historial de Vehículos Entregados">
          <div className="text-center py-12 text-muted-foreground">Cargando historial...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Historial de Vehículos Entregados">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, cliente, cédula o número de orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {selectedOrder ? (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Button>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de Orden Archivada</CardTitle>
                  <CardDescription>
                    Orden #{selectedOrder.orderNumber || selectedOrder.originalOrderId.slice(0, 8)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Información del Cliente */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Datos del Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nombre:</span>
                        <p className="font-medium">{selectedOrder.client.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cédula:</span>
                        <p className="font-medium">{selectedOrder.client.idNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Teléfono:</span>
                        <p className="font-medium">{selectedOrder.client.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedOrder.client.email}</p>
                      </div>
                      {selectedOrder.client.address && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Dirección:</span>
                          <p className="font-medium">{selectedOrder.client.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Información del Vehículo */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Datos del Vehículo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Marca:</span>
                        <p className="font-medium">{selectedOrder.vehicle.brand}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modelo:</span>
                        <p className="font-medium">{selectedOrder.vehicle.model}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Año:</span>
                        <p className="font-medium">{selectedOrder.vehicle.year}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Placa:</span>
                        <p className="font-medium">
                          <Badge variant="outline">{selectedOrder.vehicle.licensePlate}</Badge>
                        </p>
                      </div>
                      {selectedOrder.vehicle.color && (
                        <div>
                          <span className="text-muted-foreground">Color:</span>
                          <p className="font-medium">{selectedOrder.vehicle.color}</p>
                        </div>
                      )}
                      {selectedOrder.vehicle.vin && (
                        <div>
                          <span className="text-muted-foreground">VIN:</span>
                          <p className="font-medium">{selectedOrder.vehicle.vin}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Servicios */}
                  {selectedOrder.services && selectedOrder.services.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Servicios Realizados
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.services.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                          >
                            <Badge variant={service.completed ? "default" : "secondary"}>
                              {service.completed ? "✓" : "○"}
                            </Badge>
                            <span className="text-sm">{service.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cotización */}
                  {selectedOrder.quotation && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cotización Final
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                selectedOrder.quotation.items.reduce(
                                  (sum, item) => sum + item.total,
                                  0
                                )
                              )}
                            </span>
                          </div>
                          {selectedOrder.quotation.includeIVA && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IVA (19%):</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  selectedOrder.quotation.items.reduce(
                                    (sum, item) => sum + item.total,
                                    0
                                  ) * 0.19
                                )}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between">
                            <span className="font-semibold">Total:</span>
                            <span className="font-bold text-lg">
                              {formatCurrency(selectedOrder.quotation.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Diagnóstico */}
                  {selectedOrder.diagnosis && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Diagnóstico</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedOrder.diagnosis}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Descripción */}
                  {selectedOrder.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Descripción</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedOrder.description}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Fechas */}
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fechas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fecha de Creación:</span>
                        <p className="font-medium">
                          {new Date(selectedOrder.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha de Entrega:</span>
                        <p className="font-medium">
                          {new Date(selectedOrder.deliveredAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha de Archivado:</span>
                        <p className="font-medium">
                          {new Date(selectedOrder.archivedAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {selectedOrder.technicianName && (
                        <div>
                          <span className="text-muted-foreground">Técnico:</span>
                          <p className="font-medium">{selectedOrder.technicianName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredOrders.length} {filteredOrders.length === 1 ? "orden archivada" : "órdenes archivadas"}
                </p>
              </div>

              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {searchTerm
                        ? "No se encontraron órdenes que coincidan con la búsqueda"
                        : "No hay órdenes archivadas aún"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                {order.vehicle.licensePlate}
                              </Badge>
                              {order.orderNumber && (
                                <Badge variant="secondary">
                                  #{order.orderNumber}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold mb-1">
                              {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Cliente: {order.client.name} - {order.client.idNumber}
                            </p>
                            {order.quotation && (
                              <p className="text-sm font-medium">
                                Total: {formatCurrency(order.quotation.total)}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>
                              Entregado:{" "}
                              {new Date(order.deliveredAt).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}


