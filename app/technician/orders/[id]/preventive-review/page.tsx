"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getServiceOrderById, getChecklistCategories, savePreventiveReview } from "@/lib/db"
import type { ServiceOrder, ChecklistCategory, PreventiveReview, DTCCode, ReviewItem } from "@/lib/types"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import { Plus, Trash2, Check, AlertTriangle, XCircle, Wrench, Package } from "lucide-react"

interface ReviewItemState {
  status: 'ok' | 'warning' | 'urgent' | null;
  needsPart: boolean;
  laborCost: string;
}

interface DTCEntry {
  id: string;
  isManual: boolean;
  letter: string;
  digits: string[];
  manualCode: string;
  description: string;
}

export default function TechnicianPreventiveReview() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  
  const [itemStates, setItemStates] = useState<Record<string, Record<string, ReviewItemState>>>({})
  const [dtcStates, setDtcStates] = useState<Record<string, DTCEntry[]>>({})
  const [generalObservations, setGeneralObservations] = useState("")
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadData(id as string)
  }, [id])

  const loadData = async (orderId: string) => {
    try {
      const savedOrder = await getServiceOrderById(orderId)
      if (!savedOrder) throw new Error("Order not found")
      setOrder(savedOrder)

      const cats = await getChecklistCategories()
      setCategories(cats)

      // Initialize states
      const initialItems: Record<string, Record<string, ReviewItemState>> = {}
      const initialDtcs: Record<string, DTCEntry[]> = {}

      cats.forEach(cat => {
        initialItems[cat.title] = {}
        cat.items.forEach(item => {
          initialItems[cat.title][item] = { status: null, needsPart: false, laborCost: "" }
        })
        if (cat.isEscaner) {
          initialDtcs[cat.title] = [{
            id: Date.now().toString(),
            isManual: false,
            letter: "P",
            digits: ["", "", "", ""],
            manualCode: "",
            description: ""
          }]
        }
      })
      setItemStates(initialItems)
      setDtcStates(initialDtcs)
    } catch (e) {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const updateItemState = (catTitle: string, itemName: string, field: keyof ReviewItemState, value: any) => {
    setItemStates(prev => ({
      ...prev,
      [catTitle]: {
        ...prev[catTitle],
        [itemName]: {
          ...prev[catTitle]?.[itemName],
          [field]: value
        }
      }
    }))
  }

  const toggleStatus = (catTitle: string, itemName: string, status: 'ok' | 'warning' | 'urgent') => {
    // Si ya estaba seleccionado, lo deselecciona
    const currentStatus = itemStates[catTitle]?.[itemName]?.status
    updateItemState(catTitle, itemName, 'status', currentStatus === status ? null : status)
  }

  const addDtcEntry = (catTitle: string) => {
    setDtcStates(prev => ({
      ...prev,
      [catTitle]: [
        ...(prev[catTitle] || []),
        { id: Date.now().toString(), isManual: false, letter: "P", digits: ["", "", "", ""], manualCode: "", description: "" }
      ]
    }))
  }

  const removeDtcEntry = (catTitle: string, index: number) => {
    setDtcStates(prev => ({
      ...prev,
      [catTitle]: prev[catTitle].filter((_, i) => i !== index)
    }))
  }

  const updateDtcEntry = (catTitle: string, index: number, field: keyof DTCEntry, value: any) => {
    setDtcStates(prev => {
      const arr = [...(prev[catTitle] || [])]
      arr[index] = { ...arr[index], [field]: value }
      return { ...prev, [catTitle]: arr }
    })
  }

  const updateDtcDigit = (catTitle: string, entryIndex: number, digitIndex: number, val: string) => {
    // Solo permitir números
    if (val && !/^\d$/.test(val)) return;

    setDtcStates(prev => {
      const arr = [...(prev[catTitle] || [])]
      const newDigits = [...arr[entryIndex].digits]
      newDigits[digitIndex] = val
      arr[entryIndex] = { ...arr[entryIndex], digits: newDigits }
      return { ...prev, [catTitle]: arr }
    })

    // Auto-focus next input hack if value is entered
    if (val) {
      const nextId = `dtc-${catTitle}-${entryIndex}-${digitIndex + 1}`
      const el = document.getElementById(nextId)
      if (el) el.focus()
    }
  }

  const handleFocusDtcDigit = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }

  const handleSave = async () => {
    if (!order) return
    setSaving(true)
    
    let globalNeedsPart = false

    const finalCategories = categories.map(cat => {
      // Build ReviewItems for this cat
      const reviewItems: ReviewItem[] = cat.items.map(item => {
        const iState = itemStates[cat.title][item]
        const stateStatus = iState.status || 'ok'
        if (iState.needsPart && stateStatus !== 'ok') globalNeedsPart = true

        return {
          id: `${cat.id}-${item}`,
          name: item,
          status: stateStatus,
          needsPart: stateStatus !== 'ok' ? iState.needsPart : false,
          laborCost: stateStatus !== 'ok' && iState.laborCost ? parseFloat(iState.laborCost) : 0
        }
      })

      // Build DTCs if applicable
      let dtcs: DTCCode[] = []
      if (cat.isEscaner && dtcStates[cat.title]) {
        dtcs = dtcStates[cat.title]
          .filter(dtc => (dtc.isManual ? dtc.manualCode.trim() !== '' : dtc.digits.join('').trim() !== '')) // Only save filled ones
          .map(dtc => ({
            code: dtc.isManual ? dtc.manualCode : `${dtc.letter}${dtc.digits.join('')}`,
            isManual: dtc.isManual,
            description: dtc.description
          }))
      }

      return {
        title: cat.title,
        isEscaner: cat.isEscaner,
        items: reviewItems,
        dtcCodes: dtcs.length > 0 ? dtcs : undefined
      }
    })

    const reviewDoc: Partial<PreventiveReview> = {
      serviceOrderId: order.id,
      status: globalNeedsPart ? 'pending_admin' : 'quoted',
      categories: finalCategories,
      generalObservations: generalObservations
    }

    try {
      await savePreventiveReview(reviewDoc)
      toast.success("Revisión guardada exitosamente")
      router.push(`/technician/orders/${order.id}`)
    } catch (e) {
      toast.error("Error al guardar la revisión")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
     <ProtectedRoute allowedRoles={["technician", "admin"]}>
        <DashboardLayout title="Revisión General Preventiva"><div className="p-8 text-center">Cargando formato...</div></DashboardLayout>
     </ProtectedRoute>
  )

  return (
    <ProtectedRoute allowedRoles={["technician", "admin"]}>
      <DashboardLayout title="Revisión General Preventiva">
        <div className="max-w-5xl mx-auto pb-20">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 rounded-t-xl mb-6 shadow-md">
            <h1 className="text-2xl font-bold mb-2">Revisión Preventiva: Orden #{order?.orderNumber || order?.id.slice(0,8)}</h1>
            <p className="text-slate-300">Completa el formulario revisando el estado de cada ítem.</p>
             <div className="flex gap-4 mt-4 text-sm font-medium">
               <div className="flex items-center gap-1 text-green-400"><Check className="h-4 w-4"/> Bueno / OK</div>
               <div className="flex items-center gap-1 text-yellow-400"><AlertTriangle className="h-4 w-4"/> Revisar Pronto</div>
               <div className="flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4"/> Urgente</div>
             </div>
             <p className="text-xs text-slate-400 mt-2">Nota: Puedes omitir (dejar en blanco) los campos que no revisaste o no aplican.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <Card key={idx} className="shadow-sm border-slate-200 h-fit">
                <div className="bg-slate-100 text-slate-800 font-bold px-4 py-3 border-b uppercase text-sm flex items-center justify-between">
                  {cat.title}
                  {cat.isEscaner && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">Escáner</span>}
                </div>
                
                <CardContent className="p-0">
                  {/* Códigos DTC si aplica */}
                  {cat.isEscaner && (
                    <div className="bg-blue-50/50 p-4 border-b border-dashed border-blue-200">
                       <Label className="text-xs font-semibold text-blue-800 mb-2 block uppercase">Códigos DTC Registrados</Label>
                       
                       {(dtcStates[cat.title] || []).map((dtc, dtcIdx) => (
                         <div key={dtcIdx} className="mb-4 bg-white p-3 rounded border border-blue-100 relative">
                            <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-bold text-slate-400">CÓDIGO #{dtcIdx + 1}</span>
                               <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => removeDtcEntry(cat.title, dtcIdx)}>
                                 <XCircle className="h-3 w-3 text-red-400" />
                               </Button>
                            </div>
                            
                            {!dtc.isManual ? (
                              <div className="flex items-center gap-1 mb-2">
                                <Select value={dtc.letter} onValueChange={(v) => updateDtcEntry(cat.title, dtcIdx, 'letter', v)}>
                                  <SelectTrigger className="w-14 h-9 p-0 font-bold justify-center"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="P">P</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="U">U</SelectItem>
                                  </SelectContent>
                                </Select>
                                {dtc.digits.map((digit, dIdx) => (
                                  <Input 
                                    key={dIdx}
                                    id={`dtc-${cat.title}-${dtcIdx}-${dIdx}`}
                                    className="w-9 h-9 text-center font-bold px-0"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => updateDtcDigit(cat.title, dtcIdx, dIdx, e.target.value)}
                                    onFocus={handleFocusDtcDigit}
                                  />
                                ))}
                              </div>
                            ) : (
                               <Input 
                                 placeholder="Ingrese el código manualmente..."
                                 className="h-9 font-mono mb-2"
                                 value={dtc.manualCode}
                                 onChange={(e) => updateDtcEntry(cat.title, dtcIdx, 'manualCode', e.target.value)}
                               />
                            )}
                            
                            <Input 
                               placeholder="Descripción de la falla"
                               className="h-8 text-xs"
                               value={dtc.description}
                               onChange={(e) => updateDtcEntry(cat.title, dtcIdx, 'description', e.target.value)}
                            />

                            <div className="mt-2 text-right">
                               <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={() => updateDtcEntry(cat.title, dtcIdx, 'isManual', !dtc.isManual)}>
                                 {dtc.isManual ? "Usar formato estándar P0000" : "Ingresar formato manual"}
                               </Button>
                            </div>
                         </div>
                       ))}
                       <Button size="sm" variant="outline" className="w-full text-xs h-7 border-dashed border-blue-300 text-blue-700 bg-white" onClick={() => addDtcEntry(cat.title)}>
                          <Plus className="h-3 w-3 mr-1" /> Añadir otro código DTC
                       </Button>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="divide-y">
                    {cat.items.map((item, itemIdx) => {
                      const state = itemStates[cat.title]?.[item]
                      if (!state) return null

                      const isFailed = state.status === 'warning' || state.status === 'urgent'

                      return (
                        <div key={itemIdx} className={`p-3 transition-colors ${state.status ? 'bg-slate-50/50' : 'bg-white'}`}>
                           <div className="flex items-center justify-between gap-2">
                             <span className="text-xs font-semibold text-slate-700 flex-1">{item}</span>
                             
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => toggleStatus(cat.title, item, 'ok')}
                                 className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                                   ${state.status === 'ok' ? 'bg-green-500 border-green-500 text-white shadow-inner' : 'bg-white border-slate-300 text-slate-300 hover:border-green-400 hover:text-green-400'}`}
                               >
                                 ✓
                               </button>
                               <button 
                                 onClick={() => toggleStatus(cat.title, item, 'warning')}
                                 className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                                   ${state.status === 'warning' ? 'bg-yellow-500 border-yellow-500 text-white shadow-inner' : 'bg-white border-slate-300 text-slate-300 hover:border-yellow-400 hover:text-yellow-400'}`}
                               >
                                 —
                               </button>
                               <button 
                                 onClick={() => toggleStatus(cat.title, item, 'urgent')}
                                 className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                                   ${state.status === 'urgent' ? 'bg-red-500 border-red-500 text-white shadow-inner' : 'bg-white border-slate-300 text-slate-300 hover:border-red-400 hover:text-red-400'}`}
                               >
                                 X
                               </button>
                             </div>
                           </div>

                           {/* Si está en advertencia o urgente, abrir el panel de costos */}
                           {isFailed && (
                             <div className="mt-3 p-3 bg-slate-100 rounded-md border border-slate-200 animate-in slide-in-from-top-2">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                                  <Wrench className="h-3 w-3" /> Reparación Requerida
                                </Label>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Costo Mano de Obra ($)</Label>
                                    <Input 
                                      type="number" 
                                      placeholder="0" 
                                      className="h-8 text-sm mt-1" 
                                      value={state.laborCost}
                                      onChange={(e) => updateItemState(cat.title, item, 'laborCost', e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-200">
                                    <Checkbox 
                                      id={`part-${cat.title}-${item}`} 
                                      checked={state.needsPart}
                                      onCheckedChange={(c) => updateItemState(cat.title, item, 'needsPart', !!c)}
                                    />
                                    <Label htmlFor={`part-${cat.title}-${item}`} className="text-xs font-medium cursor-pointer flex items-center gap-1">
                                      <Package className="h-3 w-3 text-orange-500"/> ¿Requiere un Repuesto?
                                    </Label>
                                  </div>
                                </div>
                             </div>
                           )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
               <CardTitle className="text-sm uppercase tracking-wide">Observaciones Generales</CardTitle>
            </CardHeader>
            <CardContent>
               <Textarea 
                 placeholder="Cualquier recomendación o anomalía que no encaje en las categorías superiores..."
                 className="min-h-[100px]"
                 value={generalObservations}
                 onChange={(e) => setGeneralObservations(e.target.value)}
               />
               <div className="mt-6 flex justify-end">
                 <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto" size="lg" onClick={handleSave} disabled={saving}>
                   <Check className="h-5 w-5 mr-2" />
                   {saving ? "Registrando..." : "Guardar Revisión y Continuar"}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
