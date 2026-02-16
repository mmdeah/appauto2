"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getReports, deleteReport } from "@/lib/db"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Report } from "@/lib/types"

export default function TechnicianReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const reportsList = await getReports()
      setReports(reportsList)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este reporte?")) return

    try {
      await deleteReport(reportId)
      const updatedReports = await getReports()
      setReports(updatedReports)
    } catch (error) {
      console.error("[v0] Error deleting report:", error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["technician"]}>
        <DashboardLayout title="Reportes Técnicos">
          <div className="text-center py-12 text-muted-foreground">Cargando reportes...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["technician"]}>
      <DashboardLayout title="Reportes Técnicos">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/technician">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Link>
              </Button>
              <h2 className="text-2xl font-bold">Reportes de Diagnóstico</h2>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Los reportes solo se pueden crear desde las órdenes de servicio. Vaya a una orden y use el botón "Crear Reporte" para documentar diagnósticos. La placa del vehículo se detecta automáticamente.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="pt-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No hay reportes registrados</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{report.licensePlate}</h3>
                          <Badge>{report.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{report.text}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
