"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Plus, Trash2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getReports, getVehicles, getServiceOrders, getClients, deleteReport } from "@/lib/db"
import { generateVehicleReportHTML, printInvoice } from "@/lib/invoice-generator"
import type { Report, Vehicle, ServiceOrder, Client } from "@/lib/types"

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
] as const

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  
  // Formulario de reporte
  const [selectedLicensePlate, setSelectedLicensePlate] = useState("")
  const [reportCategory, setReportCategory] = useState("")
  const [reportText, setReportText] = useState("")
  const [reportNotes, setReportNotes] = useState("")
  
  // Lista de reportes agregados para el vehículo seleccionado
  interface VehicleReportItem {
    id: string
    category: string
    text: string
  }
  const [vehicleReports, setVehicleReports] = useState<VehicleReportItem[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportsData, vehiclesData, ordersData, clientsData] = await Promise.all([
        getReports(),
        getVehicles(),
        getServiceOrders(),
        getClients(),
      ])
      setReports(reportsData)
      setVehicles(vehiclesData)
      setOrders(ordersData)
      setClients(clientsData)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReport = () => {
    if (!reportCategory || !reportText.trim()) {
      alert("Por favor complete la categoría y el texto del reporte")
      return
    }

    const newReport: VehicleReportItem = {
      id: Date.now().toString(),
      category: reportCategory,
      text: reportText,
    }

    setVehicleReports([...vehicleReports, newReport])
    
    // Limpiar campos del formulario
    setReportCategory("")
    setReportText("")
  }

  const handleRemoveReport = (id: string) => {
    setVehicleReports(vehicleReports.filter(r => r.id !== id))
  }

  const handleMarkAsOk = async (reportId: string) => {
    if (!confirm("¿Está seguro de que desea marcar este reporte como OK y eliminarlo?")) {
      return
    }

    try {
      await deleteReport(reportId)
      await loadData() // Recargar la lista de reportes
      alert("✅ Reporte marcado como OK y eliminado exitosamente")
    } catch (error) {
      console.error("Error al eliminar reporte:", error)
      alert("Error al eliminar el reporte. Por favor, intente nuevamente.")
    }
  }

  const handleGeneratePDF = () => {
    if (!selectedLicensePlate) {
      alert("Por favor seleccione una placa de vehículo")
      return
    }

    if (vehicleReports.length === 0) {
      alert("Por favor agregue al menos un reporte antes de generar el PDF")
      return
    }

    try {
      const vehicle = vehicles.find(v => v.licensePlate === selectedLicensePlate)
      if (!vehicle) {
        alert("No se encontró el vehículo con esa placa")
        return
      }

      // Buscar orden y cliente asociados
      const order = orders.find(o => o.vehicleId === vehicle.id)
      const client = order ? clients.find(c => c.id === order.clientId) : undefined

      // Convertir los reportes al formato esperado
      const reports = vehicleReports.map(r => ({
        licensePlate: selectedLicensePlate,
        category: r.category,
        text: r.text,
        notes: reportNotes || undefined,
        createdAt: new Date().toISOString(),
      }))

      const reportHTML = generateVehicleReportHTML(reports, vehicle, client, reportNotes || undefined)
      printInvoice(reportHTML, `Reporte_${selectedLicensePlate}`, "invoice")
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      alert("Error al generar el PDF. Por favor, intente nuevamente.")
    }
  }

  // Obtener placas únicas de vehículos
  const licensePlates = Array.from(new Set(vehicles.map(v => v.licensePlate))).sort()

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Reportes">
          <div className="text-center py-12 text-muted-foreground">Cargando reportes...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Reportes de Vehículos">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mitad Izquierda: Reportes de Técnicos */}
            <div className="space-y-4">
              <h2 className="font-semibold text-xl">Reportes de Técnicos</h2>
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay reportes técnicos registrados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reports
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">{report.licensePlate}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {report.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {new Date(report.createdAt).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsOk(report.id)}
                              className="flex-shrink-0"
                              title="Marcar como OK y eliminar"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                          <Separator className="my-2" />
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">{report.text}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>

            {/* Mitad Derecha: Formulario para Crear Reporte */}
            <div className="space-y-4">
              <h2 className="font-semibold text-xl">Crear Reporte de Vehículo</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Nuevo Reporte</CardTitle>
                  <CardDescription>Agregue múltiples reportes por categoría para el mismo vehículo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="license-plate">Placa del Vehículo *</Label>
                    <Select 
                      value={selectedLicensePlate} 
                      onValueChange={(value) => {
                        setSelectedLicensePlate(value)
                        setVehicleReports([]) // Limpiar reportes al cambiar de vehículo
                      }}
                    >
                      <SelectTrigger id="license-plate">
                        <SelectValue placeholder="Seleccione una placa" />
                      </SelectTrigger>
                      <SelectContent>
                        {licensePlates.map((plate) => (
                          <SelectItem key={plate} value={plate}>
                            {plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de reportes agregados */}
                  {vehicleReports.length > 0 && (
                    <div className="space-y-2">
                      <Label>Reportes Agregados ({vehicleReports.length})</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {vehicleReports.map((report) => (
                          <div key={report.id} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {report.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{report.text}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveReport(report.id)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

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
                    <Label htmlFor="report-text">Reporte *</Label>
                    <Textarea
                      id="report-text"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Escriba el reporte detallado..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleAddReport}
                    disabled={!reportCategory || !reportText.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Reporte
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="report-notes">Observaciones Generales (Opcional)</Label>
                    <Textarea
                      id="report-notes"
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Escriba observaciones adicionales que aplican a todos los reportes..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleGeneratePDF}
                    disabled={!selectedLicensePlate || vehicleReports.length === 0}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generar PDF ({vehicleReports.length} {vehicleReports.length === 1 ? 'reporte' : 'reportes'})
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

