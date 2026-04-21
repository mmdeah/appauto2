"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getServiceOrderById, getPreventiveReviewByOrderId, updateQuotation, updateServiceOrder, getVehicles, getClients } from "@/lib/db"
import type { ServiceOrder, PreventiveReview, Quotation, QuotationItem, Vehicle, Client } from "@/lib/types"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, AlertTriangle, FileText, Plus, XCircle, Wrench, Package, PackagePlus, Trash2, User, Car, Phone, Mail, CreditCard, Calendar } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyInput } from "@/components/currency-input"

export default function AdminPreventiveReview() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [review, setReview] = useState<PreventiveReview | null>(null)
  
  // State for Admin Inputs
  const [partPrices, setPartPrices] = useState<Record<string, { price: string, desc: string, isPending: boolean }>>({})
  const [additionalParts, setAdditionalParts] = useState<{ category: string, description: string, price: string, isPending: boolean }[]>([])
  
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    if (id) loadData(id as string)
  }, [id])

  const loadData = async (orderId: string) => {
    setLoading(true)
    try {
      const [savedOrder, vehicles, clients] = await Promise.all([
         getServiceOrderById(orderId),
         getVehicles(),
         getClients()
      ])
      
      if (!savedOrder) throw new Error("Order not found")
      setOrder(savedOrder)
      setVehicle(vehicles.find(v => v.id === savedOrder.vehicleId) || null)
      setClient(clients.find(c => c.id === savedOrder.clientId) || null)

      const savedReview = await getPreventiveReviewByOrderId(orderId)
      if (savedReview) {
        setReview(savedReview)
        
        // Init state for part prices
        const initialPrices: Record<string, { price: string, desc: string, isPending: boolean }> = {}
        savedReview.categories.forEach(cat => {
          cat.items.forEach(item => {
            if (item.needsPart) {
              initialPrices[item.id] = {
                price: item.partPrice ? item.partPrice.toString() : "",
                desc: item.partDescription || `${item.name} (Repuesto)`,
                isPending: false
              }
            }
          })
        })
        setPartPrices(initialPrices)
        
        if (savedReview.additionalAdminParts) {
           setAdditionalParts(savedReview.additionalAdminParts.map(p => ({ ...p, price: p.price.toString(), isPending: false })))
        }
      }
    } catch (e) {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const updatePartPrice = (itemId: string, field: 'price' | 'desc' | 'isPending', value: any) => {
    setPartPrices(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }))
  }

  const updateLaborCost = (catIdx: number, itemIdx: number, val: number) => {
    if (!review) return
    const newRev = { ...review }
    newRev.categories[catIdx].items[itemIdx].laborCost = val
    setReview(newRev)
  }

  const addAdditionalPart = (catTitle: string) => {
    setAdditionalParts([...additionalParts, { category: catTitle, description: "", price: "", isPending: false }])
  }

  const updateAdditionalPart = (index: number, field: 'description' | 'price' | 'isPending', value: any) => {
    const arr = [...additionalParts]
    arr[index][field] = value
    setAdditionalParts(arr)
  }

  const removeAdditionalPart = (index: number) => {
    setAdditionalParts(additionalParts.filter((_, i) => i !== index))
  }

  const handleConvertToQuotation = async () => {
    if (!order || !review) return
    setConverting(true)

    try {
      const qItems: QuotationItem[] = []
      let total = 0

      review.categories.forEach(cat => {
        // 1. Agregar Mano de Obra
        cat.items.forEach(item => {
          if (item.laborCost > 0) {
            const cost = item.laborCost
            qItems.push({
              id: `labor-${item.id}`,
              category: cat.title,
              description: `Mano de obra: ${item.name}`,
              quantity: 1,
              unitPrice: cost,
              total: cost,
              includesTax: false
            })
            total += cost
          }

          // 2. Agregar Repuestos si aplica
          if (item.needsPart) {
            const pAdmin = partPrices[item.id]
            const cost = (pAdmin && pAdmin.price && !pAdmin.isPending) ? parseFloat(pAdmin.price) : 0
            const desc = (pAdmin && pAdmin.isPending) ? `${(pAdmin.desc || item.name)} (PENDIENTE)` : (pAdmin && pAdmin.desc ? pAdmin.desc : `Repuesto: ${item.name}`)
            
            if (cost > 0 || (pAdmin && pAdmin.isPending)) {
              qItems.push({
                id: `part-${item.id}`,
                category: cat.title,
                description: desc,
                quantity: 1,
                unitPrice: cost,
                total: cost,
                includesTax: false
              })
              total += cost
            }
          }
        })

        // 3. Agregar repuestos adicionales de esta categoria
        additionalParts.filter(p => p.category === cat.title).forEach((p, idx) => {
           const cost = (p.price && !p.isPending) ? parseFloat(p.price) : 0
           const desc = p.isPending ? `${p.description} (PENDIENTE)` : p.description
           if ((cost > 0 || p.isPending) && p.description.trim() !== "") {
              qItems.push({
                id: `add-part-${cat.title}-${idx}`,
                category: cat.title,
                description: p.description,
                quantity: 1,
                unitPrice: cost,
                total: cost,
                includesTax: false
              })
              total += cost
           }
        })
      })

      const newQuotation: Quotation = {
        id: order.quotation?.id || `quot-${Date.now()}`,
        items: [...(order.quotation?.items || []).filter(i => !i.category), ...qItems], // Keep NON-category items just in case
        subtotal: order.quotation?.subtotal || total, // This would be recalculated correctly on backend/real app, doing simple sum
        tax: 0,
        total: (order.quotation?.items || []).filter(i => !i.category).reduce((acc, i) => acc + i.total, 0) + total,
        includesTax: false,
        createdAt: order.quotation?.createdAt || new Date().toISOString(),
        createdBy: order.quotation?.createdBy || "admin"
      }

      await updateQuotation(order.id, newQuotation)
      
      // Update review status to quoted
      await fetch(`/api/preventive-reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, status: 'quoted' })
      })

      // Update Service Order state if it was still in reception/diagnosis
      if (order.state === 'reception') {
         await updateServiceOrder(order.id, { state: 'quotation' })
      }

      toast.success("Cotización generada exitosamente")
      router.push(`/admin/orders/${order.id}`)
    } catch (e) {
      toast.error("Error al convertir a cotización")
    } finally {
      setConverting(false)
    }
  }

  if (loading) return (
     <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Revisar Diagnóstico"><div className="p-8 text-center">Cargando revisión...</div></DashboardLayout>
     </ProtectedRoute>
  )

  if (!review) return (
     <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Revisar Diagnóstico"><div className="p-8 text-center">El técnico aún no ha llenado el formato de esta orden.</div></DashboardLayout>
     </ProtectedRoute>
  )

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Valorizar Revisión Preventiva">
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-xl font-bold flex items-center gap-2">Orden #{order?.orderNumber || order?.id.slice(0,8)}</h1>
               <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border">
                  <div className="space-y-2">
                     <p className="font-semibold text-slate-900 flex items-center gap-1.5 border-b pb-1 mb-2"><Car className="h-4 w-4 text-blue-600" /> Datos del Vehículo</p>
                     {vehicle ? (
                        <>
                          <p><span className="text-slate-500 mr-2">Placa:</span> <strong className="uppercase">{vehicle.licensePlate}</strong></p>
                          <p><span className="text-slate-500 mr-2">Marca/Modelo:</span> {vehicle.brand} {vehicle.model}</p>
                          <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400"/> <span className="text-slate-500 mr-1">Año:</span> {vehicle.year}</p>
                        </>
                     ) : <p className="text-xs italic text-slate-400">Cargando vehículo...</p>}
                  </div>
                  <div className="space-y-2">
                     <p className="font-semibold text-slate-900 flex items-center gap-1.5 border-b pb-1 mb-2"><User className="h-4 w-4 text-green-600" /> Datos del Cliente</p>
                     {client ? (
                        <>
                          <p><span className="text-slate-500 mr-2">Nombre:</span> <strong>{client.name}</strong></p>
                          {client.idNumber && <p className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-slate-400"/> <span className="text-slate-500 mr-1">CC/ID:</span> {client.idNumber}</p>}
                          {client.phone && <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400"/> <span className="text-slate-500 mr-1">Tel:</span> {client.phone}</p>}
                          {client.email && <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400"/> <span className="text-slate-500 mr-1">Email:</span> {client.email}</p>}
                        </>
                     ) : <p className="text-xs italic text-slate-400">Cargando cliente...</p>}
                  </div>
               </div>
               <p className="text-slate-500 text-xs mt-3 bg-blue-50 text-blue-800 p-2 rounded inline-block">El técnico ha enviado el reporte preventivo. Puedes ajustar la mano de obra sugerida e ingresar los costos de los repuestos.</p>
            </div>
            {review.status === 'quoted' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold font-mono text-center flex-shrink-0">YA COTIZADO</span>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {review.categories.map((cat, idx) => {
              // Filtrar items que fallaron o tienen componentes DTC
              const failedItems = cat.items.filter(item => item.status !== 'ok' && item.status !== null)
              const hasDtcs = cat.isEscaner && cat.dtcCodes && cat.dtcCodes.length > 0
              const adds = additionalParts.filter(p => p.category === cat.title)
              
              if (failedItems.length === 0 && !hasDtcs && adds.length === 0) return null; // No need to show perfect categories unless adding parts

              return (
                <Card key={idx} className="border-slate-200">
                  <div className="bg-slate-50 border-b px-4 py-3 font-bold uppercase text-sm flex justify-between items-center group">
                    {cat.title}
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => addAdditionalPart(cat.title)}>
                      <PackagePlus className="h-3 w-3 mr-1" /> Repuesto Extra
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    
                    {/* Mostrar DTCs */}
                    {hasDtcs && (
                      <div className="p-4 bg-blue-50 border-b border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Códigos de Falla Escáner</h4>
                        <div className="space-y-2">
                          {cat.dtcCodes!.map((dtc, dtcIdx) => (
                             <div key={dtcIdx} className="flex gap-3 bg-white p-2 rounded border border-blue-200 shadow-sm">
                               <div className="bg-blue-600 text-white font-mono px-3 py-1 rounded text-sm font-bold flex items-center">{dtc.code}</div>
                               <div className="flex-1 flex items-center text-sm">{dtc.description || <i className="text-slate-400">Sin descripción aportada por el técnico</i>}</div>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fails */}
                    <div className="divide-y">
                      {failedItems.map((item, iIdx) => (
                        <div key={iIdx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {item.status === 'urgent' ? 
                                  <XCircle className="h-4 w-4 text-red-500" /> : 
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                }
                                 <span className="flex items-center gap-1 font-semibold text-slate-800">{item.name}</span>
                              </div>
                              <div className="flex flex-col gap-2 text-sm text-slate-600 pl-6">
                                 <Label className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Wrench className="h-3 w-3"/> MANO DE OBRA</Label>
                                 <CurrencyInput 
                                   className="h-8 text-sm w-32 font-bold" 
                                   value={item.laborCost} 
                                   onChange={(val) => updateLaborCost(idx, iIdx, val)} 
                                 />
                              </div>
                           </div>

                           {/* Si necesita repuesto, Input Admin */}
                           {item.needsPart && (
                             <div className="bg-orange-50 p-3 rounded border border-orange-200 w-full md:w-1/2">
                                <Label className="text-[10px] uppercase font-bold text-orange-600 mb-2 flex items-center justify-between gap-1">
                                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Costear Repuesto</span>
                                  <div className="flex items-center space-x-1">
                                    <Checkbox 
                                       id={`pnd-${item.id}`} 
                                       checked={partPrices[item.id]?.isPending || false}
                                       onCheckedChange={(c) => updatePartPrice(item.id, 'isPending', !!c)}
                                    />
                                    <Label htmlFor={`pnd-${item.id}`} className="text-[10px] font-bold text-orange-800 cursor-pointer">Pendiente</Label>
                                  </div>
                                </Label>
                                <div className="space-y-2">
                                  <Input 
                                    placeholder="Descripción exacta del repuesto..." 
                                    className="h-8 text-xs bg-white"
                                    value={partPrices[item.id]?.desc || ""}
                                    onChange={(e) => updatePartPrice(item.id, 'desc', e.target.value)}
                                  />
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">VALOR</span>
                                    <CurrencyInput 
                                      placeholder="0" 
                                      disabled={partPrices[item.id]?.isPending}
                                      className={`h-8 text-sm font-semibold ${partPrices[item.id]?.isPending ? 'bg-slate-100 opacity-50' : 'bg-white'}`}
                                      value={partPrices[item.id]?.price ? parseFloat(partPrices[item.id].price) : 0}
                                      onChange={(val) => updatePartPrice(item.id, 'price', val.toString())}
                                    />
                                  </div>
                                </div>
                             </div>
                           )}
                        </div>
                      ))}

                      {/* Additional Parts block */}
                      {adds.map((addPart, aIdx) => {
                         const globalIdx = additionalParts.findIndex(p => p === addPart)
                         return (
                           <div key={`add-${aIdx}`} className="p-4 bg-slate-50 flex flex-col md:flex-row md:items-end gap-3 rounded-md mx-4 my-2 border border-dashed shadow-sm">
                              <div className="flex-1">
                                <Label className="text-xs">Repuesto Especial / Extra</Label>
                                <Input 
                                  placeholder="Ej. Líquido de frenos DOT4..." 
                                  className="h-8 mt-1 bg-white" 
                                  value={addPart.description}
                                  onChange={(e) => updateAdditionalPart(globalIdx, 'description', e.target.value)}
                                />
                              </div>
                              <div className="w-full md:w-1/3">
                                <div className="flex items-center justify-between">
                                   <Label className="text-xs">Precio</Label>
                                   <div className="flex items-center space-x-1 mb-1">
                                      <Checkbox 
                                         id={`apnd-${globalIdx}`} 
                                         checked={addPart.isPending}
                                         onCheckedChange={(c) => updateAdditionalPart(globalIdx, 'isPending', !!c)}
                                      />
                                      <Label htmlFor={`apnd-${globalIdx}`} className="text-[10px] font-bold text-slate-500 cursor-pointer">Pendiente</Label>
                                    </div>
                                </div>
                                <CurrencyInput 
                                  placeholder="0" 
                                  disabled={addPart.isPending}
                                  className={`h-8 bg-white ${addPart.isPending ? 'opacity-50' : ''}`} 
                                  value={addPart.price ? parseFloat(addPart.price) : 0}
                                  onChange={(val) => updateAdditionalPart(globalIdx, 'price', val.toString())}
                                />
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 md:mb-0 mb-4 self-end md:self-auto" onClick={() => removeAdditionalPart(globalIdx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                         )
                      })}

                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {review.generalObservations && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Observaciones del Técnico</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-slate-700 italic border-l-4 border-slate-300 pl-4 py-1">{review.generalObservations}</p></CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4 bg-white p-4 rounded border sticky bottom-4 shadow-lg">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto" onClick={handleConvertToQuotation} disabled={converting}>
              <FileText className="h-5 w-5 mr-2" />
              {converting ? "Procesando..." : "Convertir a Cotización Final"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
