"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, LogOut, Loader2 } from "lucide-react"
import { getVehicleByLicensePlate, getServiceOrdersByVehicleId } from "@/lib/db"
import { useAuth } from "@/lib/auth-context"

export default function ClientPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [licensePlateInput, setLicensePlateInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    const normalizedInput = licensePlateInput.trim().toUpperCase()

    if (!normalizedInput) {
      setError("Por favor ingrese una placa válida")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Search for vehicle in database
      const vehicle = await getVehicleByLicensePlate(normalizedInput)

      if (!vehicle) {
        setError("No se encontró ningún vehículo con esta placa")
        setLoading(false)
        return
      }

      // Get orders for this vehicle
      const orders = await getServiceOrdersByVehicleId(vehicle.id)

      if (orders.length === 0) {
        setError("Este vehículo no tiene órdenes de servicio registradas")
        setLoading(false)
        return
      }

      const mostRecentOrder = orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]

      router.push(`/client/orders/${mostRecentOrder.id}`)
    } catch (err) {
      console.error("[v0] Error searching vehicle:", err)
      setError("Error al buscar el vehículo. Por favor intente nuevamente.")
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="absolute top-4 right-4">
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Volver al Login
        </Button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <Car className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-3">Portal del Cliente</h1>
          <p className="text-lg text-muted-foreground">Consulte el estado de su vehículo en tiempo real</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Buscar Vehículo</CardTitle>
            <CardDescription>Ingrese la placa de su vehículo para ver sus órdenes de servicio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">Placa del Vehículo</Label>
              <Input
                id="licensePlate"
                placeholder="ABC123"
                value={licensePlateInput}
                onChange={(e) => {
                  setLicensePlateInput(e.target.value.toUpperCase())
                  setError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
                className="text-lg font-semibold text-center"
                disabled={loading}
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
            <Button className="w-full" onClick={handleSearch} disabled={!licensePlateInput.trim() || loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Buscar Mi Vehículo"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
