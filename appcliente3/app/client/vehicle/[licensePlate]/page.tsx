"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Car, ArrowLeft, Clock, CheckCircle, FileText, Wrench } from "lucide-react"
import { getVehicleByLicensePlate, getServiceOrdersByVehicleId } from "@/lib/db"
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from "@/lib/utils-service"
import type { ServiceOrder, Vehicle, ServiceState } from "@/lib/types"
import Link from "next/link"

const STATE_ICONS: Record<ServiceState, any> = {
  reception: Car,
  quotation: FileText,
  process: Wrench,
  quality: CheckCircle,
}

const STATE_STEPS: ServiceState[] = ["reception", "quotation", "process", "quality"]

export default function ClientVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const licensePlate = params.licensePlate as string

  const [loading, setLoading] = useState(true)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [activeOrder, setActiveOrder] = useState<ServiceOrder | null>(null)

  useEffect(() => {
    loadVehicleData()
  }, [licensePlate])

  const loadVehicleData = async () => {
    setLoading(true)
    try {
      const vehicleData = await getVehicleByLicensePlate(licensePlate)

      if (!vehicleData) {
        router.push("/client")
        return
      }

      const orders = await getServiceOrdersByVehicleId(vehicleData.id)

      // Filter out delivered orders and get the most recent active order
      const activeOrders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setVehicle(vehicleData)
      setActiveOrder(activeOrders[0] || null)
    } catch (error) {
      console.error("[v0] Error loading vehicle data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground text-lg">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return null
  }

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-6">
            <Button variant="ghost" onClick={() => router.push("/client")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Buscar otro vehículo
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {vehicle.brand} {vehicle.model}
                </h2>
                <p className="text-4xl font-bold text-primary mb-2">{vehicle.licensePlate}</p>
                <p className="text-muted-foreground">No hay órdenes de servicio activas para este vehículo</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const currentStepIndex = STATE_STEPS.indexOf(activeOrder.state)
  const progress = ((currentStepIndex + 1) / STATE_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/client")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Buscar otro vehículo
            </Button>
            <Badge variant="outline" className="text-sm">
              {activeOrder.orderNumber}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Vehicle Info Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-2">
              <Car className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-5xl font-bold text-primary mb-3">{vehicle.licensePlate}</p>
              <p className="text-muted-foreground text-lg">{activeOrder.description}</p>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="overflow-hidden border-2">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Estado del Servicio</h2>
                <Badge className={SERVICE_STATE_COLORS[activeOrder.state]} variant="secondary">
                  {SERVICE_STATE_LABELS[activeOrder.state]}
                </Badge>
              </div>
              <Progress value={progress} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground text-center">{Math.round(progress)}% completado</p>
            </div>

            <CardContent className="p-6">
              {/* Timeline */}
              <div className="relative">
                {STATE_STEPS.map((step, index) => {
                  const Icon = STATE_ICONS[step]
                  const isCompleted = index < currentStepIndex
                  const isCurrent = index === currentStepIndex
                  const isPending = index > currentStepIndex

                  return (
                    <div key={step} className="relative">
                      <div className="flex items-start gap-4 pb-8">
                        {/* Icon */}
                        <div
                          className={`
                            relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all
                            ${isCompleted ? "bg-primary border-primary text-primary-foreground" : ""}
                            ${isCurrent ? "bg-background border-primary text-primary shadow-lg shadow-primary/20 scale-110" : ""}
                            ${isPending ? "bg-muted border-border text-muted-foreground" : ""}
                          `}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2">
                          <h3
                            className={`font-semibold text-lg mb-1 ${
                              isCurrent ? "text-primary" : isPending ? "text-muted-foreground" : ""
                            }`}
                          >
                            {SERVICE_STATE_LABELS[step]}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step === "reception" && "Vehículo recibido en taller"}
                            {step === "quotation" && "Generando presupuesto del servicio"}
                            {step === "process" && "Realizando reparaciones y trabajos"}
                            {step === "quality" && "Verificación final antes de entrega"}
                          </p>
                          {isCurrent && (
                            <Badge variant="outline" className="mt-2 gap-1">
                              <Clock className="h-3 w-3" />
                              En progreso
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Connector Line */}
                      {index < STATE_STEPS.length - 1 && (
                        <div
                          className={`absolute left-6 top-12 bottom-0 w-0.5 -translate-x-1/2 ${
                            index < currentStepIndex ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Quotation Info */}
              {activeOrder.quotation && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Presupuesto Total</p>
                      <p className="text-3xl font-bold text-primary">
                        ${activeOrder.quotation.total.toLocaleString("es-CO")} COP
                      </p>
                    </div>
                    <Link href={`/client/orders/${activeOrder.id}`}>
                      <Button size="lg">Ver Detalles</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6 text-center">
                <Link href={`/client/orders/${activeOrder.id}`}>
                  <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                    <FileText className="h-4 w-4" />
                    Ver Orden Completa
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mantente informado</h3>
                  <p className="text-sm text-muted-foreground">
                    El estado de tu vehículo se actualiza en tiempo real. Vuelve a consultar en cualquier momento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
