"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CurrencyInput } from "@/components/currency-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Car, Plus, Trash2, Save, CheckCircle2, FileText, Edit, Download, Package, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"
import Link from "next/link"
import {
  getServiceOrderById,
  updateServiceOrder,
  getVehicles,
  getUsers,
  getClients,
  getClientById,
  getStateHistoryByOrderId,
  createStateHistory,
  updateQuotation,
  createRevenue,
  updateClient,
} from "@/lib/db"
import { generateInvoiceHTML, printInvoice, generateQualityControlHTML } from "@/lib/invoice-generator"
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS, generateId, formatCurrency, getNextState, getPreviousState } from "@/lib/utils-service"
import type { ServiceOrder, Vehicle, User as UserType, Client, StateHistory, QuotationItem, ServiceState } from "@/lib/types"
import { generateOrderSummaryHTML } from "@/lib/order-summary-html"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [technician, setTechnician] = useState<UserType | null>(null)
  const [allTechnicians, setAllTechnicians] = useState<UserType[]>([])
  const [history, setHistory] = useState<StateHistory[]>([])

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string>("")

  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [invoiceNoteDialogOpen, setInvoiceNoteDialogOpen] = useState(false)
  const [invoiceNote, setInvoiceNote] = useState("")
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false)
  const [clientEditForm, setClientEditForm] = useState({
    name: "",
    idNumber: "",
    phone: "",
    email: "",
  })

  const [editForm, setEditForm] = useState({
    description: "",
    diagnosis: "",
    technicianId: "",
    state: "" as ServiceState,
    estimatedCost: 0,
    finalCost: 0,
  })

  const [adminObservation, setAdminObservation] = useState("")
  const [observationDialogOpen, setObservationDialogOpen] = useState(false)
  const [includesTax, setIncludesTax] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    const orderId = params.id as string
    try {
      const [orderData, vehicles, users, clients, historyData] = await Promise.all([
        getServiceOrderById(orderId),
        getVehicles(),
        getUsers(),
        getClients(),
        getStateHistoryByOrderId(orderId),
      ])

      if (!orderData) {
        router.push("/admin")
        return
      }

      console.log("📦 Orden cargada:", orderData)
      console.log("🚗 Vehículos disponibles:", vehicles.length)
      console.log("👥 Clientes disponibles:", clients.length)
      console.log("🔍 Buscando vehículo con ID:", orderData.vehicleId)
      console.log("🔍 Buscando cliente con ID:", orderData.clientId)

      const foundVehicle = vehicles.find((v) => v.id === orderData.vehicleId)
      const foundClient = clients.find((c) => c.id === orderData.clientId)

      console.log("✅ Vehículo encontrado:", foundVehicle)
      console.log("✅ Cliente encontrado:", foundClient)

      setOrder(orderData)
      setVehicle(foundVehicle || null)
      setClient(foundClient || null)
      setTechnician(orderData.technicianId ? users.find((u) => u.id === orderData.technicianId) || null : null)
      setAllTechnicians(users.filter((u) => u.role === "technician"))
      setHistory(historyData.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()))

      if (orderData.quotation) {
        const globalIncludesTax = orderData.quotation.includesTax ?? true
        const items = (orderData.quotation.items || []).map((it) => ({
          ...it,
          includesTax: it.includesTax !== undefined ? it.includesTax : globalIncludesTax,
        }))
        setQuotationItems(items)
        setIncludesTax(globalIncludesTax)
      }

      setEditForm({
        description: orderData.description,
        diagnosis: orderData.diagnosis || "",
        technicianId: orderData.technicianId || "",
        state: orderData.state,
        estimatedCost: orderData.estimatedCost || 0,
        finalCost: orderData.finalCost || 0,
      })

      setAdminObservation(orderData.adminObservation || "")

      if (foundClient) {
        setClientEditForm({
          name: foundClient.name,
          idNumber: foundClient.idNumber,
          phone: foundClient.phone,
          email: foundClient.email,
        })
      }
    } catch (error) {
      console.error("[v0] Error loading order data:", error)
    }
  }

  const addQuotationItem = () => {
    if (!newItem.description.trim() || newItem.unitPrice <= 0) {
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
  }

  const removeQuotationItem = (id: string) => {
    setQuotationItems(quotationItems.filter((item) => item.id !== id))
    selectedItemIds.delete(id)
    setSelectedItemIds(new Set(selectedItemIds))
  }

  const updateQuotationItem = (id: string, field: keyof QuotationItem, value: any) => {
    setQuotationItems(
      quotationItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            updated.total = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      }),
    )
  }

  const saveQuotation = async () => {
    if (!order || !user || quotationItems.length === 0) return

    setIsSaving(true)
    setMessage("")

    try {
      const { subtotal, tax, total } = quotationItems.reduce(
        (acc, item) => {
          const base = item.total
          const itemIva = (item.includesTax !== false) ? base * 0.19 : 0
          return {
            subtotal: acc.subtotal + base,
            tax: acc.tax + itemIva,
            total: acc.total + base + itemIva,
          }
        },
        { subtotal: 0, tax: 0, total: 0 }
      )

      await updateQuotation(order.id, {
        items: quotationItems,
        subtotal,
        tax,
        total,
        includesTax: tax > 0,
        createdBy: user.id,
      })

      setMessage("Cotización guardada correctamente")
      setIsQuoteDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("[v0] Error saving quotation:", err)
      setMessage("Error al guardar la cotización")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItemIds)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItemIds(new Set(newSelection)) // Corrected line
  }

  const acceptSelectedItems = async () => {
    if (!order || selectedItemIds.size === 0) return

    try {
      const selectedItems = quotationItems.filter((item) => selectedItemIds.has(item.id))

      const newServices = selectedItems.map((item) => ({
        id: generateId(),
        description: item.description,
        completed: false,
      }))

      const existingServices = order.services || []
      const updatedServices = [...existingServices, ...newServices]

      await updateServiceOrder(order.id, {
        services: updatedServices,
      })

      setMessage(`${selectedItems.length} ítem(s) agregado(s) a Servicios Programados`)
      setSelectedItemIds(new Set())
      await loadData()

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error accepting items:", error)
      setMessage("Error al agregar ítems")
    }
  }

  const saveOrderChanges = async () => {
    if (!order || !user) return

    setIsSaving(true)
    setMessage("")

    try {
      const updates: Partial<ServiceOrder> = {
        description: editForm.description,
        diagnosis: editForm.diagnosis || undefined,
        technicianId: editForm.technicianId || undefined,
        state: editForm.state,
        estimatedCost: editForm.estimatedCost > 0 ? editForm.estimatedCost : undefined,
        finalCost: editForm.finalCost > 0 ? editForm.finalCost : undefined,
      }

      if (editForm.state !== order.state) {
        await createStateHistory({
          serviceOrderId: order.id,
          previousState: order.state,
          newState: editForm.state,
          changedBy: user.id,
          notes: `Estado: ${SERVICE_STATE_LABELS[editForm.state]}`,
        })
      }

      await updateServiceOrder(order.id, updates)

      setMessage("Orden actualizada correctamente")
      setIsEditDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("[v0] Error updating order:", err)
      setMessage("Error al actualizar la orden")
    } finally {
      setIsSaving(false)
    }
  }

  const saveAdminObservation = async () => {
    if (!order || !user) return

    setIsSaving(true)
    setMessage("")

    try {
      await updateServiceOrder(order.id, {
        adminObservation: adminObservation.trim() || undefined,
        updatedAt: new Date().toISOString(),
      })

      setMessage("Observación guardada correctamente")
      setObservationDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("[v0] Error saving observation:", err)
      setMessage("Error al guardar la observación")
    } finally {
      setIsSaving(false)
    }
  }

  const downloadInvoice = () => {
    if (!order || !order.quotation) return

    const invoiceContent = `
CUENTA DE COBRO
=====================================

Orden #: ${order.id.slice(0, 8)}
Fecha: ${new Date().toLocaleDateString("es-ES")}

Cliente: ${client?.name || "N/A"}
Vehículo: ${vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}` : "N/A"}

DETALLE DE SERVICIOS
=====================================

${order.quotation.items
  .map(
    (item) =>
      `${item.description}
  Cantidad: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`,
  )
  .join("\n\n")}

=====================================
Subtotal: ${formatCurrency(order.quotation.subtotal)}
${order.quotation.includesTax ? `IVA (19%): ${formatCurrency(order.quotation.tax)}` : ""}
TOTAL: ${formatCurrency(order.quotation.total)}
=====================================
    `.trim()

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cuenta-cobro-${order.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setMessage("Cuenta de cobro descargada")
    setTimeout(() => setMessage(""), 3000)
  }

  const removeScheduledService = async (serviceId: string) => {
    if (!order) return

    try {
      const updatedServices = order.services?.filter((s) => s.id !== serviceId) || []

      await updateServiceOrder(order.id, {
        services: updatedServices,
      })

      setMessage("Servicio eliminado correctamente")
      await loadData()

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error removing service:", error)
      setMessage("Error al eliminar servicio")
    }
  }

  const markAsDelivered = async () => {
    if (!order || !user) return

    setIsSaving(true)
    setMessage("")

    try {
      await createStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: "delivered",
        changedBy: user.id,
        notes: "Estado: Entregado",
      })

      if (order.quotation && order.quotation.total > 0) {
        await createRevenue({
          serviceOrderId: order.id,
          amount: order.quotation.total,
          date: new Date().toISOString(),
          description: `Orden ${order.orderNumber || order.id.slice(0, 8)} - ${vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}`,
        })
      }

      // Actualizar orden - eliminar fotos para optimizar espacio, mantener solo información de texto
      await updateServiceOrder(order.id, {
        state: "delivered",
        deliveredAt: new Date().toISOString(),
        intakePhotos: [], // Eliminar fotos de ingreso
        servicePhotos: [], // Eliminar fotos de servicio
      })

      // Generar HTML del resumen de la orden (misma plantilla que antes se enviaba por email)
      if (client && vehicle) {
        const summaryHtml = generateOrderSummaryHTML(
          order,
          client,
          vehicle,
          technician,
          history,
        )

        const licensePlate =
          vehicle.licensePlate || `Orden_${order.orderNumber || order.id.slice(0, 8)}`

        // Abrir ventana de impresión / guardar como PDF
        printInvoice(summaryHtml, licensePlate, "invoice")
      }

      setMessage("Orden marcada como entregada, ganancia registrada y resumen generado")
      setDeliveryDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("[v0] Error marking as delivered:", err)
      setMessage("Error al marcar como entregada")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order) return

    setIsSaving(true)
    setMessage("")

    try {
      const { deleteServiceOrder } = await import("@/lib/db")
      await deleteServiceOrder(order.id)
      router.push("/admin")
    } catch (err) {
      console.error("[v0] Error deleting order:", err)
      setMessage("Error al eliminar la orden")
      setIsSaving(false)
    }
  }

  const openPhotoDialog = (photoUrl: string) => {
    setSelectedPhoto(photoUrl)
    setPhotoDialogOpen(true)
  }

  const downloadInvoicePDF = () => {
    if (!order || !order.quotation || !vehicle || !client) {
      alert("No se puede generar la factura. Faltan datos necesarios.")
      return
    }

    // Abrir el diálogo para pedir la nota/observación
    setInvoiceNote("")
    setInvoiceNoteDialogOpen(true)
  }

  const handleGenerateInvoiceWithNote = () => {
    if (!order || !order.quotation || !vehicle || !client) {
      alert("No se puede generar la factura. Faltan datos necesarios.")
      return
    }

    try {
      // Generar el HTML de la cuenta de cobro con la nota
      const invoiceHTML = generateInvoiceHTML(order, client, vehicle, "invoice", invoiceNote)
      
      // Usar la placa del vehículo como nombre de la factura
      const licensePlate = vehicle.licensePlate || "SIN-PLACA"
      printInvoice(invoiceHTML, licensePlate, "invoice")
      
      // Cerrar el diálogo y limpiar la nota
      setInvoiceNoteDialogOpen(false)
      setInvoiceNote("")
    } catch (error) {
      console.error("Error al generar la factura:", error)
      alert("Error al generar la factura. Por favor, intente nuevamente.")
    }
  }

  const downloadQuotationPDF = () => {
    if (!order || !order.quotation || !vehicle || !client) {
      alert("No se puede generar la cotización. Faltan datos necesarios.")
      return
    }

    try {
      // Generar el HTML de la cotización
      const quotationHTML = generateInvoiceHTML(order, client, vehicle, "quotation")
      
      // Usar la placa del vehículo como nombre del documento
      const licensePlate = vehicle.licensePlate || "SIN-PLACA"
      printInvoice(quotationHTML, licensePlate, "quotation")
    } catch (error) {
      console.error("Error al generar la cotización:", error)
      alert("Error al generar la cotización. Por favor, intente nuevamente.")
    }
  }

  const handleEditClient = () => {
    if (client) {
      setClientEditForm({
        name: client.name,
        idNumber: client.idNumber,
        phone: client.phone,
        email: client.email,
      })
      setEditClientDialogOpen(true)
    }
  }

  const saveClientChanges = async () => {
    if (!client || !order) return

    setIsSaving(true)
    setMessage("")

    try {
      // Validar campos requeridos
      if (!clientEditForm.name || !clientEditForm.idNumber || !clientEditForm.phone || !clientEditForm.email) {
        setMessage("Por favor complete todos los campos requeridos")
        setIsSaving(false)
        return
      }

      // Verificar si hay otro cliente con la misma cédula o email (excluyendo el actual)
      const allClients = await getClients()
      const existingByIdNumber = allClients.find(
        c => c.idNumber === clientEditForm.idNumber && c.id !== client.id
      )
      const existingByEmail = allClients.find(
        c => c.email.toLowerCase() === clientEditForm.email.toLowerCase() && c.id !== client.id
      )

      if (existingByIdNumber) {
        setMessage("Ya existe otro cliente con esta cédula")
        setIsSaving(false)
        return
      }

      if (existingByEmail) {
        setMessage("Ya existe otro cliente con este correo electrónico")
        setIsSaving(false)
        return
      }

      // Actualizar el cliente
      const updatedClient = await updateClient(client.id, {
        name: clientEditForm.name,
        idNumber: clientEditForm.idNumber,
        phone: clientEditForm.phone,
        email: clientEditForm.email,
      })

      if (updatedClient) {
        setClient(updatedClient)
        setMessage("Datos del cliente actualizados correctamente")
        setEditClientDialogOpen(false)
        await loadData()
      } else {
        setMessage("Error al actualizar los datos del cliente")
      }
    } catch (err) {
      console.error("[v0] Error updating client:", err)
      setMessage("Error al actualizar los datos del cliente")
    } finally {
      setIsSaving(false)
    }
  }

  const downloadQualityControlPDF = () => {
    if (!order || !order.qualityControlCheck || !vehicle || !client) {
      alert("No se puede generar el PDF. El control de calidad no está completado.")
      return
    }

    try {
      // Generar el HTML del control de calidad
      const qualityHTML = generateQualityControlHTML(order, client, vehicle, order.qualityControlCheck)
      
      // Usar la placa del vehículo como nombre del documento
      const licensePlate = vehicle.licensePlate || "SIN-PLACA"
      printInvoice(qualityHTML, licensePlate, "invoice") // Control de calidad usa el mismo formato
    } catch (error) {
      console.error("Error al generar el PDF de control de calidad:", error)
      alert("Error al generar el PDF. Por favor, intente nuevamente.")
    }
  }

  const handleStateAdvance = async () => {
    if (!order || !user) return
    const nextState = getNextState(order.state)
    if (!nextState) return

    // Validar que si el estado actual es "quality", debe tener el formulario completado
    if (order.state === "quality" && !order.qualityControlCheck) {
      alert("No se puede avanzar de estado. Debe completarse el control de calidad primero.")
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      await createStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: nextState,
        changedBy: user.id,
        notes: `Estado: ${SERVICE_STATE_LABELS[nextState]}`,
      })

      await updateServiceOrder(order.id, {
        state: nextState,
      })

      setMessage("Estado adelantado correctamente")
      await loadData()
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
      await createStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: previousState,
        changedBy: user.id,
        notes: `Estado: ${SERVICE_STATE_LABELS[previousState]}`,
      })

      await updateServiceOrder(order.id, {
        state: previousState,
      })

      setMessage("Estado atrasado correctamente")
      await loadData()
    } catch (err) {
      console.error("[v0] Error retreating state:", err)
      setMessage("Error al atrasar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  if (!order) {
    return null
  }

  const quotationTotals = quotationItems.reduce(
    (acc, item) => {
      const base = item.total
      const itemIva = (item.includesTax !== false) ? base * 0.19 : 0
      return {
        subtotal: acc.subtotal + base,
        tax: acc.tax + itemIva,
        total: acc.total + base + itemIva,
      }
    },
    { subtotal: 0, tax: 0, total: 0 }
  )
  const quotationSubtotal = quotationTotals.subtotal
  const quotationTax = quotationTotals.tax
  const quotationTotal = quotationTotals.total

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Detalle de Orden">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {order.quotation && (
                <Button onClick={downloadInvoicePDF} variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4" />
                  Descargar Cuenta de Cobro (PDF)
                </Button>
              )}
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isSaving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Orden
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Información de la Orden</CardTitle>
                      <CardDescription>Orden #{order.id.slice(0, 8)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStateRetreat}
                        disabled={isSaving || !getPreviousState(order.state)}
                        title="Atrasar estado"
                        className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Badge className={SERVICE_STATE_COLORS[order.state]}>{SERVICE_STATE_LABELS[order.state]}</Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStateAdvance}
                        disabled={
                          isSaving ||
                          !getNextState(order.state) ||
                          (order.state === "quality" && !order.qualityControlCheck)
                        }
                        title={
                          order.state === "quality" && !order.qualityControlCheck
                            ? "Debe completarse el control de calidad primero"
                            : "Adelantar estado"
                        }
                        className="bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Orden de Servicio</DialogTitle>
                            <DialogDescription>Modifique la información de la orden</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Descripción</Label>
                              <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Descripción del servicio"
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-diagnosis">Diagnóstico</Label>
                              <Textarea
                                id="edit-diagnosis"
                                value={editForm.diagnosis}
                                onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                                placeholder="Diagnóstico técnico"
                                rows={3}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-technician">Técnico Asignado</Label>
                                <Select
                                  value={editForm.technicianId || "none"}
                                  onValueChange={(value) =>
                                    setEditForm({ ...editForm, technicianId: value === "none" ? "" : value })
                                  }
                                >
                                  <SelectTrigger id="edit-technician">
                                    <SelectValue placeholder="Seleccionar técnico" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin asignar</SelectItem>
                                    {allTechnicians.map((tech) => (
                                      <SelectItem key={tech.id} value={tech.id}>
                                        {tech.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-state">Estado</Label>
                                <Select
                                  value={editForm.state}
                                  onValueChange={(value) => setEditForm({ ...editForm, state: value as ServiceState })}
                                >
                                  <SelectTrigger id="edit-state">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(SERVICE_STATE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4"></div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={saveOrderChanges} disabled={isSaving || !editForm.description.trim()}>
                              <Save className="h-4 w-4 mr-2" />
                              {isSaving ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción del Servicio</h4>
                    <p>{order.description}</p>
                  </div>

                  {order.diagnosis && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Diagnóstico</h4>
                      <p>{order.diagnosis}</p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Observación para el Cliente</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setObservationDialogOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {order.adminObservation ? "Editar" : "Agregar"} Observación
                      </Button>
                    </div>
                    {order.adminObservation ? (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{order.adminObservation}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No hay observaciones registradas</p>
                    )}
                  </div>

                  {order.services && order.services.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Servicios Programados</h4>
                      <div className="space-y-2">
                        {order.services.map((service) => (
                          <div key={service.id} className="flex items-center gap-2 p-2 border rounded">
                            <input type="checkbox" checked={service.completed} disabled className="h-4 w-4" />
                            <span className={`flex-1 ${service.completed ? "line-through text-muted-foreground" : ""}`}>
                              {service.description}
                            </span>
                            {service.completed && service.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(service.completedAt).toLocaleDateString("es-ES")}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScheduledService(service.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cotización</CardTitle>
                      <CardDescription>Gestione los ítems y costos de la orden</CardDescription>
                    </div>
                    <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <FileText className="h-4 w-4 mr-2" />
                          {order.quotation && order.quotation.items.length > 0
                            ? "Editar Cotización"
                            : "Crear Cotización"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Gestión de Cotización</DialogTitle>
                          <DialogDescription>Agregue, edite o elimine ítems de la cotización</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {quotationItems.length > 0 && (
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Ítems de la Cotización</Label>
                              {quotationItems.map((item) => {
                                // Verificar si el ítem de cotización también está en servicios programados
                                const isInScheduledServices = order.services?.some(
                                  service => service.description.toLowerCase().trim() === item.description.toLowerCase().trim()
                                ) || false;
                                
                                return (
                                  <div
                                    key={item.id}
                                    className={`grid grid-cols-12 gap-3 items-center p-3 border rounded-lg ${
                                      isInScheduledServices 
                                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                                        : 'bg-muted/30'
                                    }`}
                                  >
                                    <div className="col-span-5">
                                      <Input
                                        value={item.description}
                                        onChange={(e) => updateQuotationItem(item.id, "description", e.target.value)}
                                        placeholder="Descripción"
                                        className="h-9"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateQuotationItem(item.id, "quantity", Number.parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="Cant."
                                        className="h-9"
                                        min="0"
                                      />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                      <Checkbox
                                        id={`iva-${item.id}`}
                                        checked={item.includesTax !== false}
                                        onCheckedChange={(checked) =>
                                          updateQuotationItem(item.id, "includesTax", checked !== false)
                                        }
                                      />
                                      <Label htmlFor={`iva-${item.id}`} className="text-xs cursor-pointer">IVA</Label>
                                    </div>
                                    <div className={`col-span-2 font-semibold text-sm flex items-center gap-2 ${isInScheduledServices ? 'text-green-700 dark:text-green-300' : ''}`}>
                                      {isInScheduledServices && (
                                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                                          Programado
                                        </Badge>
                                      )}
                                      {formatCurrency(item.total)}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeQuotationItem(item.id)}
                                      className="col-span-1 h-9 w-9"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-base font-semibold">Agregar Nuevo Ítem</Label>
                            <div className="grid gap-3">
                              <div>
                                <Label htmlFor="description" className="text-sm">
                                  Descripción
                                </Label>
                                <Input
                                  id="description"
                                  value={newItem.description}
                                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                  placeholder="Descripción del servicio o repuesto"
                                  onKeyDown={(e) => e.key === "Enter" && addQuotationItem()}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="quantity" className="text-sm">
                                    Cantidad
                                  </Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) =>
                                      setNewItem({ ...newItem, quantity: Number.parseFloat(e.target.value) || 1 })
                                    }
                                    placeholder="Cantidad"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="unitPrice" className="text-sm">
                                    Precio Unitario
                                  </Label>
                                  <CurrencyInput
                                    value={newItem.unitPrice}
                                    onChange={(value) => setNewItem({ ...newItem, unitPrice: value })}
                                    placeholder="Precio"
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={addQuotationItem}
                                disabled={!newItem.description.trim() || newItem.unitPrice <= 0}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Ítem
                              </Button>
                            </div>
                          </div>

                          {quotationItems.length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Subtotal:</span>
                                  <span className="font-semibold">{formatCurrency(quotationSubtotal)}</span>
                                </div>
                                {quotationTax > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">IVA (19%):</span>
                                    <span className="font-semibold">{formatCurrency(quotationTax)}</span>
                                  </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                  <span>Total:</span>
                                  <span className="text-primary">{formatCurrency(quotationTotal)}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={saveQuotation} disabled={isSaving || quotationItems.length === 0}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Guardando..." : "Guardar Cotización"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.quotation && order.quotation.items.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Seleccionar ítems para aprobar</Label>
                          {selectedItemIds.size > 0 && (
                            <Badge variant="secondary">{selectedItemIds.size} seleccionado(s)</Badge>
                          )}
                        </div>
                        {order.quotation && vehicle && client && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadQuotationPDF}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Descargar Cotización (PDF)
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {order.quotation.items.map((item) => {
                          // Verificar si el ítem de cotización también está en servicios programados
                          const isInScheduledServices = order.services?.some(
                            service => service.description.toLowerCase().trim() === item.description.toLowerCase().trim()
                          ) || false;
                          
                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                                isInScheduledServices 
                                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50' 
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={selectedItemIds.has(item.id)}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`item-${item.id}`} className="text-sm font-medium cursor-pointer block">
                                  {item.description}
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.quantity} x {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                {isInScheduledServices && (
                                  <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                                    Programado
                                  </Badge>
                                )}
                                <p className="text-sm font-semibold whitespace-nowrap">
                                  {formatCurrency(item.total + ((item.includesTax !== false) ? item.total * 0.19 : 0))}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedItemIds.size > 0 && (
                        <Button onClick={acceptSelectedItems} className="w-full" size="lg">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aceptar {selectedItemIds.size} Ítem(s) y Agregar a Servicios Programados
                        </Button>
                      )}

                      <Separator />

                      <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-semibold">{formatCurrency(order.quotation.subtotal)}</span>
                        </div>
                        {order.quotation.includesTax && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IVA (19%):</span>
                            <span className="font-semibold">{formatCurrency(order.quotation.tax)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(order.quotation.total)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No hay cotización creada</p>
                      <p className="text-xs mt-1">Haga clic en "Crear Cotización" para comenzar</p>
                    </div>
                  )}

                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {order.intakePhotos && order.intakePhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fotos de Ingreso</CardTitle>
                    <CardDescription>Estado del vehículo al ingresar al taller</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {order.intakePhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => openPhotoDialog(photo)}
                          className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Foto ingreso ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.servicePhotos && order.servicePhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fotos del Servicio</CardTitle>
                    <CardDescription>Fotografías del trabajo realizado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {order.servicePhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => openPhotoDialog(photo)}
                          className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Foto servicio ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.qualityControlCheck && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Control de Calidad</CardTitle>
                        <CardDescription>Verificaciones realizadas antes de completar el servicio</CardDescription>
                      </div>
                      {order.qualityControlCheck && vehicle && client && (
                        <Button variant="outline" size="sm" onClick={downloadQualityControlPDF} className="gap-2">
                          <Download className="h-4 w-4" />
                          Descargar PDF
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.vehicleClean ? "text-green-600" : "text-red-600"}`} />
                        <div>
                          <p className="text-sm font-medium">Vehículo limpio</p>
                          <p className="text-xs text-muted-foreground">
                            {order.qualityControlCheck.vehicleClean ? "Verificado" : "No verificado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.noToolsInside ? "text-green-600" : "text-red-600"}`} />
                        <div>
                          <p className="text-sm font-medium">Sin herramientas adentro</p>
                          <p className="text-xs text-muted-foreground">
                            {order.qualityControlCheck.noToolsInside ? "Verificado" : "No verificado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.properlyAssembled ? "text-green-600" : "text-red-600"}`} />
                        <div>
                          <p className="text-sm font-medium">Correctamente armado</p>
                          <p className="text-xs text-muted-foreground">
                            {order.qualityControlCheck.properlyAssembled ? "Verificado" : "No verificado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.issueFixed ? "text-green-600" : "text-red-600"}`} />
                        <div>
                          <p className="text-sm font-medium">Falla corregida</p>
                          <p className="text-xs text-muted-foreground">
                            {order.qualityControlCheck.issueFixed ? "Verificado" : "No verificado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.qualityControlCheck.additionalNotes && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Notas Adicionales</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {order.qualityControlCheck.additionalNotes}
                        </p>
                      </div>
                    )}

                    {order.qualityControlCheck.checkedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Verificado el: {new Date(order.qualityControlCheck.checkedAt).toLocaleString("es-CO")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Historial de Estados</CardTitle>
                  <CardDescription>Seguimiento de cambios en la orden</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Línea vertical del timeline */}
                    <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="space-y-0">
                      {history.map((item, index) => (
                        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Punto del timeline */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-background" />
                          </div>
                          
                          {/* Contenido */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={SERVICE_STATE_COLORS[item.newState]}>
                                {SERVICE_STATE_LABELS[item.newState]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.changedAt).toLocaleString("es-ES")}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1 ml-0">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {client && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Cliente
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditClient}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Datos
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Nombre</h4>
                        <p className="font-semibold">{client.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Cédula</h4>
                        <p>{client.idNumber}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Teléfono</h4>
                        <p>{client.phone}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                        <p>{client.email}</p>
                      </div>
                      {client.phone && (
                        <Button
                          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            if (!order || !vehicle || !client) return

                            // Obtener la URL base de la aplicación (desde Railway o localhost)
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apponlinesd.up.railway.app'
                            const clientUrl = `${baseUrl}/client`

                            // Limpiar el número de teléfono (quitar espacios, guiones, paréntesis)
                            const cleanPhone = client.phone.replace(/[\s\-\(\)]/g, "")
                            // Si no tiene código de país, agregar 57 (Colombia)
                            const phoneWithCountry = cleanPhone.startsWith("57") || cleanPhone.startsWith("+57")
                              ? cleanPhone.replace("+", "")
                              : `57${cleanPhone}`
                            
                            // Determinar el mensaje según si ya se envió WhatsApp
                            let message: string
                            if (!order.whatsappSent) {
                              // Primera vez: mensaje completo con URL
                              message = `Hola ${client.name}, te contactamos desde Automotriz Online SD sobre tu orden de servicio en el Vehículo ${vehicle.licensePlate}.\n\nPuedes seguir el estado de tu orden aquí: ${clientUrl}`
                              // Marcar como enviado
                              await updateServiceOrder(order.id, {
                                whatsappSent: true,
                              })
                              // Recargar la orden
                              const updatedOrder = await getServiceOrderById(order.id)
                              if (updatedOrder) {
                                setOrder(updatedOrder)
                              }
                            } else {
                              // Ya se envió antes: mensaje con novedad
                              message = `Hola ${client.name}, tenemos una novedad en tu vehículo ${vehicle.licensePlate}, por favor revisa su estado en: ${clientUrl}`
                            }
                            
                            // Abrir WhatsApp
                            window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, "_blank")
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {order.whatsappSent ? "Enviar WhatsApp" : "Enviar WhatsApp (Primera vez)"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehicle && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Marca</h4>
                        <p>{vehicle.brand}</p>
                      </div>
                    )}
                    {vehicle && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Modelo</h4>
                        <p>{vehicle.model}</p>
                      </div>
                    )}
                    {vehicle && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Año</h4>
                        <p>{vehicle.year}</p>
                      </div>
                    )}
                    {vehicle && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Placa</h4>
                        <p>{vehicle.licensePlate}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar orden de servicio?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La orden y todo su historial serán eliminados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={isSaving}>
              {isSaving ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceNoteDialogOpen} onOpenChange={setInvoiceNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nota u Observación para la Cuenta de Cobro</DialogTitle>
            <DialogDescription>
              Ingresa una nota u observación opcional que se incluirá en el PDF de la cuenta de cobro. Puedes dejar este campo vacío si no deseas agregar ninguna nota.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="invoice-note" className="mb-2 block">
              Nota u Observación
            </Label>
            <Textarea
              id="invoice-note"
              placeholder="Ej: Pago pendiente, condiciones especiales, etc."
              value={invoiceNote}
              onChange={(e) => setInvoiceNote(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setInvoiceNoteDialogOpen(false)
              setInvoiceNote("")
            }}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateInvoiceWithNote}>
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editClientDialogOpen} onOpenChange={setEditClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Datos del Cliente</DialogTitle>
            <DialogDescription>
              Modifique los datos del cliente. Los cambios se aplicarán a esta orden y al cliente en general.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nombre *</Label>
              <Input
                id="client-name"
                value={clientEditForm.name}
                onChange={(e) => setClientEditForm({ ...clientEditForm, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-idNumber">Cédula *</Label>
              <Input
                id="client-idNumber"
                value={clientEditForm.idNumber}
                onChange={(e) => setClientEditForm({ ...clientEditForm, idNumber: e.target.value })}
                placeholder="Número de cédula"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Teléfono *</Label>
              <Input
                id="client-phone"
                value={clientEditForm.phone}
                onChange={(e) => setClientEditForm({ ...clientEditForm, phone: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email *</Label>
              <Input
                id="client-email"
                type="email"
                value={clientEditForm.email}
                onChange={(e) => setClientEditForm({ ...clientEditForm, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            {message && (
              <Alert variant={message.includes("Error") ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClientDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={saveClientChanges} disabled={isSaving || !clientEditForm.name || !clientEditForm.idNumber || !clientEditForm.phone || !clientEditForm.email}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Observación del Admin */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Observación para el Cliente</DialogTitle>
            <DialogDescription>
              Esta observación será visible para el cliente en su vista de la orden
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-observation">Observación</Label>
              <Textarea
                id="admin-observation"
                value={adminObservation}
                onChange={(e) => setAdminObservation(e.target.value)}
                placeholder="Escriba una observación para el cliente..."
                rows={6}
              />
            </div>
            {message && (
              <Alert variant={message.includes("Error") ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObservationDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={saveAdminObservation} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Observación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
