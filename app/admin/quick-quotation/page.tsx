"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/currency-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Trash2, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { getClients, getVehicles } from "@/lib/db"
import { generateInvoiceHTML, printInvoice } from "@/lib/invoice-generator"
import { generateId, formatCurrency } from "@/lib/utils-service"
import type { Client, Vehicle, QuotationItem, ServiceOrder } from "@/lib/types"

export default function QuickQuotationPage() {
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
    color: "",
  })
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0 })
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

  const addItem = () => {
    if (!newItem.description.trim() || newItem.unitPrice <= 0) {
      setError("Complete la descripción y el precio unitario")
      return
    }
    const item: QuotationItem = {
      id: generateId(),
      description: newItem.description.trim(),
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: newItem.quantity * newItem.unitPrice,
      includesTax: true,
    }
    setQuotationItems([...quotationItems, item])
    setNewItem({ description: "", quantity: 1, unitPrice: 0 })
    setError("")
  }

  const removeItem = (id: string) => {
    setQuotationItems(quotationItems.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: keyof QuotationItem, value: unknown) => {
    setQuotationItems(
      quotationItems.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice
        }
        return updated
      })
    )
  }

  const totals = quotationItems.reduce(
    (acc, item) => {
      const base = item.total
      const itemIva = item.includesTax !== false ? base * 0.19 : 0
      return {
        subtotal: acc.subtotal + base,
        tax: acc.tax + itemIva,
        total: acc.total + base + itemIva,
      }
    },
    { subtotal: 0, tax: 0, total: 0 }
  )

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
        color: manualVehicle.color || undefined,
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
    if (quotationItems.length === 0) {
      setError("Agregue al menos un ítem a la cotización")
      return
    }

    setError("")
    const order: ServiceOrder = {
      id: generateId(),
      orderNumber: `COT-${Date.now().toString(36).toUpperCase()}`,
      vehicleId: vehicle.id,
      clientId: client.id,
      state: "quotation",
      description: "",
      services: [],
      quotation: {
        id: generateId(),
        items: quotationItems,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        includesTax: totals.tax > 0,
        createdAt: new Date().toISOString(),
        createdBy: "quick",
      },
      intakePhotos: [],
      servicePhotos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const html = generateInvoiceHTML(order, client, vehicle, "quotation")
    printInvoice(html, vehicle.licensePlate, "quotation")
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Cotización Rápida">
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
                <Zap className="h-5 w-5" />
                Cotización Rápida
              </CardTitle>
              <CardDescription>
                Genere cotizaciones e imprima en PDF sin registrar ingreso del vehículo
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

              <div className="space-y-4">
                <Label className="text-base font-semibold">Ítems de la cotización</Label>
                {quotationItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-muted/30">
                    <Input
                      className="col-span-4"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Descripción"
                    />
                    <Input
                      type="number"
                      className="col-span-2"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value) || 0)}
                      placeholder="Cant."
                      min={0}
                    />
                    <div className="col-span-2 flex items-center gap-2">
                      <Checkbox
                        checked={item.includesTax !== false}
                        onCheckedChange={(c) => updateItem(item.id, "includesTax", c !== false)}
                      />
                      <Label className="text-xs">IVA</Label>
                    </div>
                    <div className="col-span-2 font-medium text-sm">{formatCurrency(item.total + (item.includesTax !== false ? item.total * 0.19 : 0))}</div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 items-end">
                  <Input
                    className="col-span-4"
                    value={newItem.description}
                    onChange={(e) => setNewItem((i) => ({ ...i, description: e.target.value }))}
                    placeholder="Descripción del servicio"
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                  />
                  <Input
                    type="number"
                    className="col-span-2"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem((i) => ({ ...i, quantity: Number(e.target.value) || 1 }))}
                    placeholder="Cant."
                    min={0}
                  />
                  <div className="col-span-3">
                    <CurrencyInput
                      value={newItem.unitPrice}
                      onChange={(v) => setNewItem((i) => ({ ...i, unitPrice: v }))}
                      placeholder="Precio unit."
                    />
                  </div>
                  <Button onClick={addItem} className="col-span-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {quotationItems.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex justify-between w-full max-w-xs">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {totals.tax > 0 && (
                      <div className="flex justify-between w-full max-w-xs">
                        <span className="text-muted-foreground">IVA:</span>
                        <span className="font-medium">{formatCurrency(totals.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full max-w-xs text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                  <Button onClick={handlePrint} size="lg" className="w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    Imprimir cotización (PDF)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

