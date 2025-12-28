"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Car } from "lucide-react"
import Link from "next/link"
import {
  getServiceOrderById,
  getVehicles,
  getClientById,
  updateServiceOrder,
  createStateHistory,
} from "@/lib/db"
import type { ServiceOrder, Vehicle, Client, QualityControlCheck } from "@/lib/types"
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from "@/lib/utils-service"
import { useAuth } from "@/lib/auth-context"

export default function QualityControlOrderPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<QualityControlCheck>({
    vehicleClean: false,
    noToolsInside: false,
    properlyAssembled: false,
    issueFixed: false,
    additionalNotes: "",
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    const orderId = params.id as string
    try {
      const orderData = await getServiceOrderById(orderId)
      if (!orderData) {
        router.push("/quality-control")
        return
      }

      // Verificar que la orden esté en estado quality
      if (orderData.state !== "quality") {
        router.push("/quality-control")
        return
      }

      setOrder(orderData)

      // Cargar datos del formulario si ya existe
      if (orderData.qualityControlCheck) {
        setFormData(orderData.qualityControlCheck)
      }

      // Cargar vehículo y cliente
      const [vehiclesData, clientData] = await Promise.all([
        getVehicles(),
        getClientById(orderData.clientId),
      ])
      
      const vehicleData = vehiclesData.find((v) => v.id === orderData.vehicleId)

      setVehicle(vehicleData)
      setClient(clientData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error al cargar los datos de la orden")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!order || !user) return

    // Validar que todos los checkboxes estén marcados
    if (
      !formData.vehicleClean ||
      !formData.noToolsInside ||
      !formData.properlyAssembled ||
      !formData.issueFixed
    ) {
      setError("Debes marcar todas las verificaciones obligatorias antes de guardar")
      return
    }

    setSaving(true)
    setError("")
    setMessage("")

    try {
      const qualityCheck: QualityControlCheck = {
        ...formData,
        checkedBy: user.id,
        checkedAt: new Date().toISOString(),
      }

      await updateServiceOrder(order.id, {
        qualityControlCheck: qualityCheck,
      })

      setMessage("Control de calidad guardado correctamente")
      await loadData()
    } catch (err) {
      console.error("Error saving quality control:", err)
      setError("Error al guardar el control de calidad")
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.vehicleClean &&
      formData.noToolsInside &&
      formData.properlyAssembled &&
      formData.issueFixed
    )
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["quality-control"]}>
        <DashboardLayout title="Control de Calidad">
          <div className="text-center py-12 text-muted-foreground">Cargando orden...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!order || !vehicle || !client) {
    return (
      <ProtectedRoute allowedRoles={["quality-control"]}>
        <DashboardLayout title="Control de Calidad">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground">Orden no encontrada</p>
            <Link href="/quality-control">
              <Button className="mt-4">Volver a Control de Calidad</Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const isCompleted = !!order.qualityControlCheck
  const orderTitle = `Control de Calidad - Orden #${order.orderNumber || order.id.slice(0, 8)}`

  return (
    <ProtectedRoute allowedRoles={["quality-control"]}>
      <DashboardLayout title={orderTitle}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/quality-control">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Completado
              </Badge>
            )}
          </div>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Vehículo</h4>
                  <p className="font-semibold">
                    {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h4>
                  <p className="font-semibold">{client.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                  <Badge className={SERVICE_STATE_COLORS[order.state]}>
                    {SERVICE_STATE_LABELS[order.state]}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h4>
                  <p>{order.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Control Form */}
          <Card>
            <CardHeader>
              <CardTitle>Formulario de Control de Calidad</CardTitle>
              <CardDescription>
                Verifica que el vehículo cumpla con todos los estándares antes de completar el
                servicio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="vehicleClean"
                    checked={formData.vehicleClean}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, vehicleClean: checked === true })
                    }
                    disabled={isCompleted}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="vehicleClean"
                      className="text-base font-medium cursor-pointer"
                    >
                      1. El vehículo está limpio
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifica que el vehículo esté completamente limpio, tanto por dentro como por
                      fuera
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="noToolsInside"
                    checked={formData.noToolsInside}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, noToolsInside: checked === true })
                    }
                    disabled={isCompleted}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="noToolsInside"
                      className="text-base font-medium cursor-pointer"
                    >
                      2. El vehículo no tiene herramientas adentro
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirma que no quedaron herramientas, repuestos o materiales dentro del
                      vehículo
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="properlyAssembled"
                    checked={formData.properlyAssembled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, properlyAssembled: checked === true })
                    }
                    disabled={isCompleted}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="properlyAssembled"
                      className="text-base font-medium cursor-pointer"
                    >
                      3. El vehículo está correctamente armado
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifica que todas las piezas estén correctamente instaladas y que no falte
                      nada
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="issueFixed"
                    checked={formData.issueFixed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, issueFixed: checked === true })
                    }
                    disabled={isCompleted}
                  />
                  <div className="flex-1">
                    <Label htmlFor="issueFixed" className="text-base font-medium cursor-pointer">
                      4. La falla ha sido corregida
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirma que el problema reportado por el cliente ha sido completamente
                      solucionado
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">5. Notas Adicionales (Opcional)</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Agrega cualquier observación adicional sobre el control de calidad..."
                    value={formData.additionalNotes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, additionalNotes: e.target.value })
                    }
                    disabled={isCompleted}
                    rows={4}
                  />
                </div>
              </div>

              {!isCompleted && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    {isFormValid() ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Todas las verificaciones completadas
                      </span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        ⚠ Debes completar todas las verificaciones obligatorias
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!isFormValid() || saving}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {saving ? "Guardando..." : "Guardar Control de Calidad"}
                  </Button>
                </div>
              )}

              {isCompleted && order.qualityControlCheck && (
                <div className="pt-4 border-t">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Control completado el:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.qualityControlCheck.checkedAt || "").toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

