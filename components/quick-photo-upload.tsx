"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, X, CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateServiceOrder, getServiceOrders } from "@/lib/db"
import type { Vehicle, ServiceOrder } from "@/lib/types"
import { toast } from "sonner"

interface QuickPhotoUploadProps {
  /** All active vehicles to match plates */
  vehicles: Vehicle[]
  /** Active service orders — used to find the order for a vehicle */
  orders: ServiceOrder[]
  /** Photo category: intake for admin, service for technician */
  photoType?: "intake" | "service"
  onUploaded?: () => void
}

export function QuickPhotoUpload({
  vehicles,
  orders,
  photoType = "intake",
  onUploaded,
}: QuickPhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<"idle" | "selectPlate" | "uploading">("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [base64, setBase64] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setBase64(result)
      setPreview(result)
      setStep("selectPlate")
      setSearch("")
      setSelectedVehicle(null)
    }
    reader.readAsDataURL(file)
    // Reset so same file can be picked again
    e.target.value = ""
  }

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.licensePlate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    )
  }).slice(0, 8)

  const handleConfirm = useCallback(async () => {
    if (!selectedVehicle || !base64) return
    setStep("uploading")

    try {
      // Find an active (non-delivered) order for this vehicle
      const order = orders
        .filter((o) => o.vehicleId === selectedVehicle.id && o.state !== "delivered")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

      if (!order) {
        toast.error(`No hay una orden activa para ${selectedVehicle.licensePlate}`)
        setStep("selectPlate")
        return
      }

      const field = photoType === "intake" ? "intakePhotos" : "servicePhotos"
      const current: string[] = (order as any)[field] || []
      await updateServiceOrder(order.id, { [field]: [...current, base64] })

      toast.success(`Foto subida a ${selectedVehicle.licensePlate} ✓`)
      setStep("idle")
      setPreview(null)
      setBase64(null)
      onUploaded?.()
    } catch {
      toast.error("Error al subir la foto")
      setStep("selectPlate")
    }
  }, [selectedVehicle, base64, orders, photoType, onUploaded])

  const handleCancel = () => {
    setStep("idle")
    setPreview(null)
    setBase64(null)
    setSelectedVehicle(null)
    setSearch("")
  }

  return (
    <div className="relative">
      {/* Hidden file input — opens camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {step === "idle" && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Subir Foto Rápida</span>
        </Button>
      )}

      {(step === "selectPlate" || step === "uploading") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Preview */}
            {preview && (
              <div className="relative w-full h-48 bg-slate-100">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-2 left-3 text-white text-sm font-semibold">
                  ¿De qué vehículo es esta foto?
                </p>
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Search input */}
              <input
                autoFocus
                type="text"
                placeholder="Buscar placa, marca o modelo..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedVehicle(null) }}
                disabled={step === "uploading"}
              />

              {/* Vehicle list */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredVehicles.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Sin resultados</p>
                )}
                {filteredVehicles.map((v) => {
                  const hasActiveOrder = orders.some(
                    (o) => o.vehicleId === v.id && o.state !== "delivered"
                  )
                  const isSelected = selectedVehicle?.id === v.id
                  return (
                    <button
                      key={v.id}
                      disabled={!hasActiveOrder || step === "uploading"}
                      onClick={() => setSelectedVehicle(v)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all
                        ${isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : hasActiveOrder
                            ? "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                    >
                      <span>
                        <span className="font-semibold">{v.licensePlate}</span>
                        <span className="ml-2 text-slate-500">{v.brand} {v.model}</span>
                      </span>
                      {!hasActiveOrder && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Sin orden activa</span>
                      )}
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={step === "uploading"}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedVehicle || step === "uploading"}
                  onClick={handleConfirm}
                >
                  {step === "uploading" ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Subiendo...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Confirmar</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
