"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar, User, Camera, Save, RefreshCw, CheckCircle2, FileText, ChevronLeft, ChevronRight } from "lucide-react"
// Las funciones ahora se importan dinámicamente desde lib/db para usar la API
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS, getNextState, getPreviousState } from "@/lib/utils-service"
import type { ServiceOrder, Vehicle, User as UserType, StateHistory, ServiceState } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { saveStateHistory, createStateHistory, createReport } from "@/lib/db"

export default function TechnicianOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [client, setClient] = useState<UserType | null>(null)
  const [history, setHistory] = useState<StateHistory[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [servicePhotos, setServicePhotos] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<ServiceState>(order?.state || "reception")
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportCategory, setReportCategory] = useState("")
  const [reportText, setReportText] = useState("")

  const REPORT_CATEGORIES = [
    "General",
    "Motor",
    "Suspensión",
    "Frenos",
    "Transmisión",
    "Sistema Eléctrico",
    "Carrocería",
    "Interior",
    "Aire Acondicionado",
    "Otros",
  ]

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const { getServiceOrderById, getVehicles, getUsers, getClients, getStateHistoryByOrderId } = await import("@/lib/db")
      
      const foundOrder = await getServiceOrderById(params.id as string)

      if (!foundOrder) {
        router.push("/technician")
        return
      }

      setOrder(foundOrder)
      setServicePhotos(foundOrder.servicePhotos || [])
      setSelectedState(foundOrder.state)

      const [allVehicles, allUsers, allClients, orderHistory] = await Promise.all([
        getVehicles(),
        getUsers(),
        getClients(),
        getStateHistoryByOrderId(foundOrder.id)
      ])

      const foundVehicle = allVehicles.find((v) => v.id === foundOrder.vehicleId)
      setVehicle(foundVehicle || null)

      const foundClient = allClients.find((c) => c.id === foundOrder.clientId)
      setClient(foundClient || null)

      setHistory(orderHistory.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()))
    } catch (error) {
      console.error("[v0] Error loading order data:", error)
    }
  }

  const toggleServiceCompletion = async (serviceId: string) => {
    if (!order || !user || !order.services) return

    const service = order.services.find((s) => s.id === serviceId)
    if (!service) return

    const wasCompleted = service.completed
    const isNowCompleted = !wasCompleted

    const updatedServices = order.services.map((service) => {
      if (service.id === serviceId) {
        return {
          ...service,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
          completedBy: isNowCompleted ? user.id : undefined,
        }
      }
      return service
    })

    const updatedOrder: ServiceOrder = {
      ...order,
      services: updatedServices,
      updatedAt: new Date().toISOString(),
    }

    // Guardar la orden actualizada usando la API
    const { saveServiceOrder } = await import("@/lib/db")
    await saveServiceOrder(updatedOrder)
    setOrder(updatedOrder)
    await loadData() // Recargar datos para obtener la última versión

    // Si el servicio fue marcado como completado, agregar al historial de estados
    if (isNowCompleted) {
      try {
        await createStateHistory({
          serviceOrderId: order.id,
          previousState: order.state,
          newState: order.state, // Mantener el mismo estado de la orden
          changedBy: user.id,
          notes: `Servicio completado: ${service.description}`,
        })
        
        // Recargar el historial
        const { getStateHistoryByOrderId } = await import("@/lib/db")
        const orderHistory = await getStateHistoryByOrderId(order.id)
        setHistory(orderHistory.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()))
      } catch (error) {
        console.error("[v0] Error al guardar historial:", error)
      }
    }

    setMessage("Servicio actualizado")
    setTimeout(() => setMessage(""), 2000)
  }

  const handleCreateReport = async () => {
    if (!vehicle || !reportCategory || !reportText.trim()) {
      alert("Por favor complete la categoría y el reporte")
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      await createReport({
        licensePlate: vehicle.licensePlate,
        category: reportCategory,
        text: reportText,
      })

      setMessage("Reporte creado exitosamente")
      setReportDialogOpen(false)
      setReportCategory("")
      setReportText("")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error creating report:", error)
      setMessage("Error al crear el reporte")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file))
    setServicePhotos([...servicePhotos, ...newPhotos])
  }

  const removePhoto = (index: number) => {
    setServicePhotos(servicePhotos.filter((_, i) => i !== index))
  }

  const handleSavePhotos = async () => {
    if (!order) return

    setIsSaving(true)
    setMessage("")

    try {
      const { compressBlobToBase64 } = await import("@/lib/image-compression")
      const servicePhotosBase64 = await Promise.all(
        servicePhotos.map(async (photo) => {
          if (photo.startsWith("blob:")) {
            return await compressBlobToBase64(photo, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.8,
              maxSizeKB: 500,
            });
          }
          // Si ya es base64, retornarlo directamente
          return photo;
        }),
      )

      const updatedOrder: ServiceOrder = {
        ...order,
        servicePhotos: servicePhotosBase64,
        updatedAt: new Date().toISOString(),
      }

      // Usar saveServiceOrder de lib/db.ts que usa la API
      const { saveServiceOrder } = await import("@/lib/db")
      await saveServiceOrder(updatedOrder)
      setMessage("Fotos guardadas correctamente")
      await loadData()
    } catch (err) {
      console.error("[v0] Error saving photos:", err)
      setMessage("Error al guardar las fotos")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStateChange = async (newState: ServiceState) => {
    if (!order || !user) return

    setIsSaving(true)
    setMessage("")

    try {
      // Save state history
      await saveStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState,
        changedBy: user.id,
        notes: `Estado actualizado por técnico`,
      })

      // Update order
      const updatedOrder: ServiceOrder = {
        ...order,
        state: newState,
        updatedAt: new Date().toISOString(),
      }

      const { updateServiceOrder } = await import("@/lib/db")
      await updateServiceOrder(order.id, updatedOrder)

      setMessage("Estado actualizado correctamente")
      setSelectedState(newState)
      loadData()
    } catch (err) {
      console.error("[v0] Error updating state:", err)
      setMessage("Error al actualizar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStateAdvance = async () => {
    if (!order || !user) return
    const nextState = getNextState(order.state)
    if (!nextState) return

    setIsSaving(true)
    setMessage("")

    try {
      await saveStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: nextState,
        changedBy: user.id,
        notes: "Estado adelantado",
      })

      const updatedOrder: ServiceOrder = {
        ...order,
        state: nextState,
        updatedAt: new Date().toISOString(),
      }

      const { updateServiceOrder } = await import("@/lib/db")
      await updateServiceOrder(order.id, updatedOrder)

      setMessage("Estado adelantado correctamente")
      setSelectedState(nextState)
      loadData()
    } catch (err) {
      console.error("[v0] Error advancing state:", err)
      setMessage("Error al adelantar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStateRetreat = async () => {
    if (!order || !user) return
    const previousState = getPreviousState(order.state)
    if (!previousState) return

    setIsSaving(true)
    setMessage("")

    try {
      await saveStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: previousState,
        changedBy: user.id,
        notes: "Estado atrasado",
      })

      const updatedOrder: ServiceOrder = {
        ...order,
        state: previousState,
        updatedAt: new Date().toISOString(),
      }

      const { updateServiceOrder } = await import("@/lib/db")
      await updateServiceOrder(order.id, updatedOrder)

      setMessage("Estado atrasado correctamente")
      setSelectedState(previousState)
      loadData()
    } catch (err) {
      console.error("[v0] Error retreating state:", err)
      setMessage("Error al atrasar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  const canEdit = !order?.technicianId || order?.technicianId === user?.id

  if (!order || !vehicle) {
    return (
      <ProtectedRoute allowedRoles={["technician"]}>
        <DashboardLayout title="Detalles de Orden">
          <div className="text-center py-12">
            <p>Orden no encontrada</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const completedServices = order.services?.filter((s) => s.completed).length || 0
  const totalServices = order.services?.length || 0

  return (
    <ProtectedRoute allowedRoles={["technician"]}>
      <DashboardLayout title="Gestión de Orden">
        <div className="max-w-4xl">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/technician">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <CardDescription className="text-base">
                      Patente: {vehicle.licensePlate} • Cliente: {client?.name || "Desconocido"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setReportDialogOpen(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Crear Reporte
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStateRetreat}
                        disabled={isSaving || !canEdit || !getPreviousState(order.state)}
                        title="Atrasar estado"
                        className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="min-w-[200px]">
                        <Select value={selectedState} onValueChange={handleStateChange} disabled={!canEdit}>
                          <SelectTrigger className={SERVICE_STATE_COLORS[selectedState]}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reception">Recepción</SelectItem>
                            <SelectItem value="quotation">Cotización</SelectItem>
                            <SelectItem value="process">Proceso</SelectItem>
                            <SelectItem value="quality">Calidad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStateAdvance}
                        disabled={isSaving || !canEdit || !getNextState(order.state)}
                        title="Adelantar estado"
                        className="bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción del Servicio</h4>
                  <p className="text-base">{order.description}</p>
                </div>

                {order.diagnosis && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnóstico</h4>
                      <p className="text-base">{order.diagnosis}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Ingreso</p>
                      <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium">{client?.name || "Desconocido"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!canEdit && (
              <Alert>
                <AlertDescription>
                  Esta orden está asignada a otro técnico. Solo puede ver la información.
                </AlertDescription>
              </Alert>
            )}

            {canEdit && order.services && Array.isArray(order.services) && order.services.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Servicios a Realizar</CardTitle>
                      <CardDescription>Marque los servicios completados</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {completedServices}/{totalServices}
                      </p>
                      <p className="text-xs text-muted-foreground">Completados</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.services.map((service) => (
                      <div
                        key={service.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                          service.completed
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <button onClick={() => toggleServiceCompletion(service.id)} className="mt-0.5">
                          {service.completed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <div className="h-6 w-6 border-2 rounded-full border-muted-foreground/30" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${service.completed ? "line-through text-muted-foreground" : ""}`}>
                            {service.description}
                          </p>
                          {service.completed && service.completedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Completado: {new Date(service.completedAt).toLocaleString("es-ES")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Fotografías del Servicio
                  </CardTitle>
                  <CardDescription>Suba fotos del trabajo realizado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePhotoUpload}
                      className="h-20 text-lg cursor-pointer border-2 border-dashed border-primary/50 hover:border-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>

                  {servicePhotos.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {servicePhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo || "/placeholder.svg"}
                              alt={`Foto ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(index)}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>

                      {message && (
                        <Alert>
                          <AlertDescription>{message}</AlertDescription>
                        </Alert>
                      )}

                      <Button onClick={handleSavePhotos} disabled={isSaving} className="w-full" size="lg">
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Fotografías
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Intake Photos - read only for technician */}
            {order.intakePhotos && order.intakePhotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fotos de Ingreso</CardTitle>
                  <CardDescription>Estado del vehículo al ingresar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {order.intakePhotos.map((photo, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Foto ingreso ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Estados</CardTitle>
                  <CardDescription>Seguimiento del progreso de la orden</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          </div>
                          {index < history.length - 1 && <div className="w-0.5 h-full min-h-8 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={SERVICE_STATE_COLORS[item.newState]} variant="secondary">
                              {SERVICE_STATE_LABELS[item.newState]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.changedAt).toLocaleString("es-ES")}
                            </span>
                          </div>
                          {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Reporte Técnico</DialogTitle>
              <DialogDescription>
                Reporte de diagnóstico para el vehículo con placa: <strong>{vehicle.licensePlate}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-category">Categoría *</Label>
                <Select value={reportCategory} onValueChange={setReportCategory}>
                  <SelectTrigger id="report-category">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-text">Reporte Técnico *</Label>
                <Textarea
                  id="report-text"
                  placeholder="Escriba el reporte detallado del diagnóstico..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReport} disabled={isSaving || !reportCategory || !reportText.trim()}>
                {isSaving ? "Guardando..." : "Guardar Reporte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
