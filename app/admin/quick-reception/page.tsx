"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Trash2, FileText, ClipboardList } from "lucide-react"
import Link from "next/link"
import { getClients, getVehicles } from "@/lib/db"
import { generateReceptionHTML, printInvoice } from "@/lib/invoice-generator"
import { generateId } from "@/lib/utils-service"
import type { Client, Vehicle } from "@/lib/types"

export default function QuickReceptionPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [useManualVehicle, setUseManualVehicle] = useState(false)
  const [manualVehicle, setManualVehicle] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
  })
  
  const [mileage, setMileage] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<{ id: string; description: string }[]>([])
  const [newService, setNewService] = useState("")
  
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [allClients, allVehicles] = await Promise.all([getClients(), getVehicles()])
      setClients(allClients)
      setVehicles(allVehicles)
    } catch (err) {
      console.error("[v0] Error loading data:", err)
      setError("Error al cargar los datos")
    }
  }

  const clientVehicles = selectedClient ? vehicles.filter((v) => v.clientId === selectedClient) : []

  const addService = () => {
    if (!newService.trim()) return
    setServices([...services, { id: generateId(), description: newService.trim() }])
    setNewService("")
  }

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id))
  }

  const handlePrint = () => {
    if (!selectedClient) {
      setError("Seleccione un cliente")
      return
    }
    const client = clients.find((c) => c.id === selectedClient)
    if (!client) {
      setError("Cliente no encontrado")
      return
    }
    let vehicle: Vehicle
    if (useManualVehicle) {
      if (!manualVehicle.brand || !manualVehicle.model || !manualVehicle.licensePlate) {
        setError("Complete marca, modelo y placa del vehículo")
        return
      }
      vehicle = {
        id: generateId(),
        clientId: selectedClient,
        brand: manualVehicle.brand,
        model: manualVehicle.model,
        year: manualVehicle.year,
        licensePlate: manualVehicle.licensePlate,
      }
    } else {
      if (!selectedVehicle) {
        setError("Seleccione un vehículo o ingrese datos manualmente")
        return
      }
      const v = vehicles.find((x) => x.id === selectedVehicle)
      if (!v) {
        setError("Vehículo no encontrado")
        return
      }
      vehicle = v
    }

    setError("")
    
    const receptionData = {
      mileage,
      notes,
      services: services.map(s => s.description)
    }
    
    const orderNumber = `REC-${Date.now().toString(36).toUpperCase().slice(-6)}`
    const html = generateReceptionHTML(client, vehicle, receptionData, orderNumber)
    
    // We reuse printInvoice but pass a custom filename prefix using licensePlate param hack
    printInvoice(html, `Reporte_${vehicle.licensePlate}`, "invoice")
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Recepción Rápida">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Acta de Recepción Rápida
              </CardTitle>
              <CardDescription>
                Genere un PDF de recepción de vehículo sin necesidad de crear una orden completa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={selectedClient} onValueChange={(v) => {
                    setSelectedClient(v)
                    setSelectedVehicle("")
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.idNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="manual-vehicle"
                      checked={useManualVehicle}
                      onCheckedChange={(c) => {
                        setUseManualVehicle(!!c)
                        if (c) setSelectedVehicle("")
                      }}
                    />
                    <Label htmlFor="manual-vehicle" className="cursor-pointer">
                      Ingresar vehículo manualmente (sin registro)
                    </Label>
                  </div>
                  {useManualVehicle ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Marca"
                        value={manualVehicle.brand}
                        onChange={(e) => setManualVehicle((v) => ({ ...v, brand: e.target.value }))}
                      />
                      <Input
                        placeholder="Modelo"
                        value={manualVehicle.model}
                        onChange={(e) => setManualVehicle((v) => ({ ...v, model: e.target.value }))}
                      />
                      <Input
                        placeholder="Placa"
                        value={manualVehicle.licensePlate}
                        onChange={(e) => setManualVehicle((v) => ({ ...v, licensePlate: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Año"
                        value={manualVehicle.year || ""}
                        onChange={(e) => setManualVehicle((v) => ({ ...v, year: Number(e.target.value) || new Date().getFullYear() }))}
                      />
                    </div>
                  ) : (
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={!selectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo del cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.brand} {v.model} - {v.licensePlate}
                          </SelectItem>
                        ))}
                        {selectedClient && clientVehicles.length === 0 && (
                          <SelectItem value="_none" disabled>Sin vehículos registrados</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kilometraje del Vehículo</Label>
                  <Input 
                    type="number" 
                    placeholder="Ej. 45000" 
                    value={mileage || ""} 
                    onChange={(e) => setMileage(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-semibold">Servicios a Realizar</Label>
                {services.map((service) => (
                  <div key={service.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <span className="flex-1 text-sm pl-2">{service.description}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeService(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Ej. Cambio de aceite, Revisión de frenos..."
                    onKeyDown={(e) => e.key === "Enter" && addService()}
                  />
                  <Button onClick={addService}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base font-semibold">Notas y Observaciones Generales</Label>
                <Textarea 
                  placeholder="Rayones, golpes, estado interior, pertenencias dejadas, etc." 
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handlePrint} size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Generar Acta de Recepción (PDF)
              </Button>

            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
