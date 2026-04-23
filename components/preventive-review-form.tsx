"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getServiceOrderById, getChecklistCategories, savePreventiveReview, getSpecialServices } from "@/lib/db"
import type { ChecklistCategory, PreventiveReview, DTCCode, ReviewItem, SpecialService } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Check, AlertTriangle, XCircle, Wrench, Package, Loader2, Sparkles } from "lucide-react"
import { CurrencyInput } from "@/components/currency-input"

interface ReviewItemState {
  status: 'ok' | 'warning' | 'urgent' | null;
  needsPart: boolean;
  laborCost: number;
  adminPricesLabor: boolean;
}

interface SpecialServiceState {
  selected: boolean;
  categoryNameSelected: string;
}

interface DTCEntry {
  id: string;
  isManual: boolean;
  letter: string;
  digits: string[];
  manualCode: string;
  description: string;
}

interface PreventiveReviewFormProps {
  orderId: string;
  onSaved?: () => void;
}

export function PreventiveReviewForm({ orderId, onSaved }: PreventiveReviewFormProps) {
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [itemStates, setItemStates] = useState<Record<string, Record<string, ReviewItemState>>>({})
  const [dtcStates, setDtcStates] = useState<Record<string, DTCEntry[]>>({})
  const [generalObservations, setGeneralObservations] = useState("")

  const [specialServices, setSpecialServices] = useState<SpecialService[]>([])
  const [ssStates, setSsStates] = useState<Record<string, SpecialServiceState>>({})
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [showMarkAllModal, setShowMarkAllModal] = useState(false)


  useEffect(() => {
    if (orderId) loadData(orderId)
  }, [orderId])

  const loadData = async (oid: string) => {
    try {
      const [cats, specs, orderData] = await Promise.all([
        getChecklistCategories(),
        getSpecialServices(),
        getServiceOrderById(oid)
      ])
      setCategories(cats)
      setSpecialServices(specs)
      setOrder(orderData)


      // Initialize states
      const initialItems: Record<string, Record<string, ReviewItemState>> = {}
      const initialDtcs: Record<string, DTCEntry[]> = {}
      const initialSs: Record<string, SpecialServiceState> = {}

      specs.forEach(s => {
        initialSs[s.id] = { selected: false, categoryNameSelected: s.askCategory ? (cats[0]?.title || "") : s.categoryName }
      })

      cats.forEach(cat => {
        initialItems[cat.title] = {}
        cat.items.forEach(item => {
          initialItems[cat.title][item] = { status: null, needsPart: false, laborCost: 0, adminPricesLabor: false }
        })
        if (cat.isEscaner) {
          initialItems[cat.title]["Revisión Especial (Escáner)"] = { status: 'warning', needsPart: false, laborCost: 0, adminPricesLabor: false }
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
      setSsStates(initialSs)
    } catch (e) {
      toast.error("Error al cargar datos del formulario")
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

  const updateSsState = (ssId: string, field: keyof SpecialServiceState, value: any) => {
    setSsStates(prev => ({
      ...prev,
      [ssId]: {
        ...prev[ssId],
        [field]: value
      }
    }))
  }

  const toggleStatus = (catTitle: string, itemName: string, status: 'ok' | 'warning' | 'urgent') => {
    const currentState = itemStates[catTitle]?.[itemName]
    const currentStatus = currentState?.status
    const newStatus = currentStatus === status ? null : status
    
    // Si se marca como algo diferente de OK, activar "Requiere repuesto" por defecto
    if (newStatus === 'warning' || newStatus === 'urgent') {
      updateItemState(catTitle, itemName, 'needsPart', true)
    }
    
    updateItemState(catTitle, itemName, 'status', newStatus)
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
    if (val && !/^\d$/.test(val)) return;

    setDtcStates(prev => {
      const arr = [...(prev[catTitle] || [])]
      const newDigits = [...arr[entryIndex].digits]
      newDigits[digitIndex] = val
      arr[entryIndex] = { ...arr[entryIndex], digits: newDigits }
      return { ...prev, [catTitle]: arr }
    })

  const handleMarkAllAsOk = () => {
    const newItems = { ...itemStates }
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (!newItems[cat.title][item].status) {
          newItems[cat.title][item].status = 'ok'
        }
      })
    })
    setItemStates(newItems)
    setShowMarkAllModal(false)
    toast.success("Todos los ítems pendientes se marcaron como OK")
  }

  const handleSave = async () => {
    if (!orderId) return
    setSaving(true)
    
    let globalNeedsPart = false

    const finalCategories = categories.map(cat => {
      const reviewItems: ReviewItem[] = cat.items.map(item => {
        const iState = itemStates[cat.title][item]
        const stateStatus = iState.status || 'ok'
        if (iState.needsPart && stateStatus !== 'ok') globalNeedsPart = true

        return {
          id: `${cat.id}-${item}`,
          name: item,
          status: stateStatus,
          needsPart: stateStatus !== 'ok' ? iState.needsPart : false,
          laborCost: stateStatus !== 'ok' && !iState.adminPricesLabor ? (iState.laborCost || 0) : 0,
          adminPricesLabor: stateStatus !== 'ok' ? iState.adminPricesLabor : false
        }
      })

      // Agregar ítem virtual de escáner si aplica
      if (cat.isEscaner && itemStates[cat.title]?.["Revisión Especial (Escáner)"]) {
        const scannerState = itemStates[cat.title]["Revisión Especial (Escáner)"]
        if (scannerState.laborCost > 0 || scannerState.adminPricesLabor) {
          reviewItems.push({
            id: `${cat.id}-scanner-labor`,
            name: "Revisión Especial (Escáner)",
            status: "warning",
            needsPart: false,
            laborCost: scannerState.adminPricesLabor ? 0 : scannerState.laborCost,
            adminPricesLabor: scannerState.adminPricesLabor
          })
        }
      }

      // Add Special Services for this category
      specialServices.forEach(s => {
        const sState = ssStates[s.id]
        if (sState && sState.selected) {
           const matchesCategory = s.askCategory ? (sState.categoryNameSelected === cat.title) : (s.categoryName === cat.title)
           if (matchesCategory) {
              reviewItems.push({
                 id: `spec-${s.id}`,
                 name: `[Especial] ${s.name}`,
                 status: 'warning',
                 needsPart: false,
                 laborCost: 0,
                 adminPricesLabor: true // They can delegate or not, but let's automate it to admin pricing for specials, or just standard 0.
              })
              globalNeedsPart = true
           }
        }
      })

      let dtcs: DTCCode[] = []
      if (cat.isEscaner && dtcStates[cat.title]) {
        dtcs = dtcStates[cat.title]
          .filter(dtc => (dtc.isManual ? dtc.manualCode.trim() !== '' : dtc.digits.join('').trim() !== '')) 
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
      serviceOrderId: orderId,
      status: globalNeedsPart ? 'pending_admin' : 'quoted',
      categories: finalCategories,
      generalObservations: generalObservations
    }

    try {
      await savePreventiveReview(reviewDoc)
      toast.success("Revisión guardada exitosamente")
      if (onSaved) onSaved()
    } catch (e) {
      toast.error("Error al guardar la revisión")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="py-8 flex justify-center items-center text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando formulario...
    </div>
  )

  if (categories.length === 0) return (
    <div className="py-8 text-center text-slate-500 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 mx-4 my-4">
      <p>No hay categorías preconfiguradas para la revisión.</p>
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl overflow-hidden mt-4 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5">
        <p className="text-slate-300 text-sm">Completa el formulario revisando el estado de cada ítem.</p>
         <div className="flex flex-wrap gap-4 mt-3 text-xs font-medium">
           <div className="flex items-center gap-1 text-green-400"><Check className="h-4 w-4"/> Bueno / OK</div>
           <div className="flex items-center gap-1 text-yellow-400"><AlertTriangle className="h-4 w-4"/> Revisar Pronto</div>
           <div className="flex items-center gap-1 text-red-400"><XCircle className="h-4 w-4"/> Urgente</div>
         </div>
         <div className="flex gap-2 items-center">
            <Button 
               variant="outline" 
               size="sm" 
               type="button"
               className="h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
               onClick={() => setShowMarkAllModal(true)}
            >
               <Check className="h-4 w-4 mr-1" /> Marcar Todo como OK
       </div>

       {order && order.services && order.services.length > 0 && (
         <div className="px-4 mb-4">
           <Card className="border-green-100 bg-green-50/20">
             <CardContent className="p-3">
               <h4 className="text-[10px] font-bold text-green-700 uppercase mb-2">Servicios Programados para esta Orden</h4>
               <div className="flex flex-wrap gap-2">
                 {order.services.map((s: any) => (
                   <div key={s.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${s.completed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                     {s.completed ? '✓ ' : ''}{s.description}
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>
       )}



      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <Card key={idx} className="shadow-none border-slate-200 dark:border-slate-800 h-fit">
            <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold px-3 py-2 border-b dark:border-slate-800 uppercase text-xs flex items-center justify-between">
              {cat.title}
              {cat.isEscaner && <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full">Escáner</span>}
            </div>
            
            <CardContent className="p-0">
              {cat.isEscaner && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 border-b border-dashed border-blue-200 dark:border-blue-900">
                   <Label className="text-[10px] font-semibold text-blue-800 dark:text-blue-400 mb-2 block uppercase">Códigos DTC Registrados</Label>
                   
                   {(dtcStates[cat.title] || []).map((dtc, dtcIdx) => (
                     <div key={dtcIdx} className="mb-3 bg-white dark:bg-slate-900 p-2.5 rounded border border-blue-100 dark:border-blue-900 relative">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-bold text-slate-400">CÓDIGO #{dtcIdx + 1}</span>
                           <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => removeDtcEntry(cat.title, dtcIdx)}>
                             <XCircle className="h-3 w-3 text-red-400" />
                           </Button>
                        </div>
                        
                        {!dtc.isManual ? (
                          <div className="flex items-center gap-1 mb-2">
                            <Select value={dtc.letter} onValueChange={(v) => updateDtcEntry(cat.title, dtcIdx, 'letter', v)}>
                              <SelectTrigger className="w-12 h-8 p-0 font-bold justify-center text-xs"><SelectValue /></SelectTrigger>
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
                                className="w-8 h-8 text-center font-bold px-0 text-xs"
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
                             className="h-8 font-mono mb-2 text-xs"
                             value={dtc.manualCode}
                             onChange={(e) => updateDtcEntry(cat.title, dtcIdx, 'manualCode', e.target.value)}
                           />
                        )}
                        
                        <Input 
                           placeholder="Descripción de la falla"
                           className="h-7 text-xs"
                           value={dtc.description}
                           onChange={(e) => updateDtcEntry(cat.title, dtcIdx, 'description', e.target.value)}
                        />

                        <div className="mt-2 text-right">
                           <Button variant="link" size="sm" className="h-auto p-0 text-[9px]" onClick={() => updateDtcEntry(cat.title, dtcIdx, 'isManual', !dtc.isManual)}>
                             {dtc.isManual ? "Usar formato estándar P0000" : "Ingresar formato manual"}
                           </Button>
                        </div>
                     </div>
                   ))}
                    <Button size="sm" variant="outline" className="w-full text-[10px] h-6 border-dashed border-blue-300 text-blue-700 bg-white dark:bg-transparent" onClick={() => addDtcEntry(cat.title)}>
                      <Plus className="h-3 w-3 mr-1" /> Añadir otro código DTC
                    </Button>

                    {/* Campo de Mano de Obra para Escáner */}
                    {dtcStates[cat.title] && dtcStates[cat.title].some(d => d.digits.some(digit => digit !== "") || d.manualCode !== "" || d.description !== "") && (
                      <div className="mt-4 p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-sm border-blue-200">
                        <Label className="text-[10px] uppercase font-bold text-blue-700 mb-2 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Mano de obra por diagnóstico avanzado
                        </Label>
                        <div className="flex gap-4 items-end">
                           <div className="flex-1">
                             <Label className="text-[10px]">Costo Sugerido</Label>
                             <CurrencyInput 
                               className="h-8 text-xs font-bold" 
                               value={itemStates[cat.title]?.["Revisión Especial (Escáner)"]?.laborCost || 0} 
                               onChange={(val) => updateItemState(cat.title, "Revisión Especial (Escáner)", 'laborCost', val)} 
                             />
                           </div>
                           <div className="flex items-center space-x-2 mb-2">
                             <Checkbox 
                               id={`delegate-scanner-${cat.title}`} 
                               checked={itemStates[cat.title]?.["Revisión Especial (Escáner)"]?.adminPricesLabor || false}
                               onCheckedChange={(c) => updateItemState(cat.title, "Revisión Especial (Escáner)", 'adminPricesLabor', !!c)}
                             />
                             <Label htmlFor={`delegate-scanner-${cat.title}`} className="text-[9px] text-slate-500 cursor-pointer">Delegar valor al admin</Label>
                           </div>
                        </div>
                      </div>
                    )}
                 </div>
               )}

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cat.items.map((item, itemIdx) => {
                  const state = itemStates[cat.title]?.[item]
                  if (!state) return null

                  const isFailed = state.status === 'warning' || state.status === 'urgent'

                  return (
                    <div key={itemIdx} className={`p-2 transition-colors ${state.status ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-transparent'}`}>
                       <div className="flex items-center justify-between gap-2">
                         <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1">{item}</span>
                         
                         <div className="flex gap-1">
                           <button 
                             onClick={() => toggleStatus(cat.title, item, 'ok')}
                             className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                               ${state.status === 'ok' ? 'bg-green-500 border-green-500 text-white shadow-inner' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-300 hover:border-green-400 hover:text-green-400'}`}
                           >
                             ✓
                           </button>
                           <button 
                             onClick={() => toggleStatus(cat.title, item, 'warning')}
                             className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                               ${state.status === 'warning' ? 'bg-yellow-500 border-yellow-500 text-white shadow-inner' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-300 hover:border-yellow-400 hover:text-yellow-400'}`}
                           >
                             —
                           </button>
                           <button 
                             onClick={() => toggleStatus(cat.title, item, 'urgent')}
                             className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-[10px] transition-all
                               ${state.status === 'urgent' ? 'bg-red-500 border-red-500 text-white shadow-inner' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-300 hover:border-red-400 hover:text-red-400'}`}
                           >
                             X
                           </button>
                         </div>
                       </div>

                       {isFailed && (
                         <div className="mt-2 p-2.5 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
                            <Label className="text-[9px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> Reparación Requerida
                            </Label>
                            <div className="space-y-2.5">
                              <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                  <Label className="text-[10px]">Costo Mano de Obra</Label>
                                  <CurrencyInput 
                                    placeholder="0" 
                                    className="h-7 text-xs mt-1" 
                                    value={state.laborCost}
                                    disabled={state.adminPricesLabor}
                                    onChange={(val) => updateItemState(cat.title, item, 'laborCost', val)}
                                  />
                                </div>
                                <div className="flex items-center space-x-2 pb-1.5">
                                  <Checkbox 
                                    id={`admin-labor-${cat.title}-${item}`} 
                                    checked={state.adminPricesLabor}
                                    onCheckedChange={(c) => updateItemState(cat.title, item, 'adminPricesLabor', !!c)}
                                  />
                                  <Label htmlFor={`admin-labor-${cat.title}-${item}`} className="text-[10px] font-medium text-slate-500 cursor-pointer">
                                    No lo fijo yo (Admin)
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                                <Checkbox 
                                  id={`part-${cat.title}-${item}`} 
                                  checked={state.needsPart}
                                  onCheckedChange={(c) => updateItemState(cat.title, item, 'needsPart', !!c)}
                                />
                                <Label htmlFor={`part-${cat.title}-${item}`} className="text-[10px] font-medium cursor-pointer flex items-center gap-1">
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

      {specialServices.length > 0 && (
        <div className="px-4 pb-4">
          <Card className="shadow-none border-blue-200 dark:border-blue-900">
            <CardHeader className="p-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900">
               <CardTitle className="text-[10px] uppercase tracking-wide text-blue-800 dark:text-blue-400 flex items-center gap-1">
                 <Sparkles className="h-3 w-3" /> Servicios Especiales Recomendados
               </CardTitle>
            </CardHeader>
            <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
               {specialServices.map(ss => {
                 const st = ssStates[ss.id]
                 if (!st) return null
                 return (
                   <div key={ss.id} className="flex items-start gap-2 p-2 border rounded border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                     <Checkbox 
                        id={`ss-${ss.id}`}
                        checked={st.selected}
                        onCheckedChange={(c) => updateSsState(ss.id, 'selected', !!c)}
                        className="mt-1"
                     />
                     <div className="flex-1 space-y-2">
                        <Label htmlFor={`ss-${ss.id}`} className="text-xs font-semibold cursor-pointer block">{ss.name}</Label>
                        {st.selected && ss.askCategory && (
                          <div>
                            <Label className="text-[10px] text-slate-500 mb-1 block">¿A qué categoría aplica?</Label>
                            <Select value={st.categoryNameSelected} onValueChange={(val) => updateSsState(ss.id, 'categoryNameSelected', val)}>
                               <SelectTrigger className="h-7 text-xs">
                                 <SelectValue placeholder="Seleccionar..." />
                               </SelectTrigger>
                               <SelectContent>
                                 {categories.map(c => <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          </div>
                        )}
                        {st.selected && !ss.askCategory && (
                          <div className="text-[10px] text-slate-500">
                            Aplica a: <span className="font-semibold">{ss.categoryName}</span>
                          </div>
                        )}
                     </div>
                   </div>
                 )
               })}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-4 pb-4">
        <Card className="shadow-none border-slate-200 dark:border-slate-800">
          <CardHeader className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
             <CardTitle className="text-[10px] uppercase tracking-wide">Observaciones Generales</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
             <Textarea 
               placeholder="Cualquier recomendación o anomalía que no encaje en las categorías superiores..."
               className="min-h-[80px] text-sm"
               value={generalObservations}
               onChange={(e) => setGeneralObservations(e.target.value)}
             />
             <div className="mt-4 flex justify-end">
               <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto" size="sm" onClick={handleSave} disabled={saving}>
                 <Check className="h-4 w-4 mr-2" />
                 {saving ? "Registrando..." : "Guardar Revisión y Finalizar"}
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
      {/* Modal Confirmación Marcar Todo */}
      {showMarkAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <Card className="max-w-md w-full shadow-2xl">
              <CardHeader className="pb-2">
                 <CardTitle className="text-lg">¿Marcar todo como revisado?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-sm text-slate-600">
                   Se marcarán como <strong>[En Buen Estado]</strong> todos los ítems que aún no han sido revisados en esta revisión preventiva.
                   ¿Confirmas que realizaste toda la revisión programada?
                 </p>
                 <div className="flex justify-end gap-3 pt-2">
                   <Button variant="ghost" size="sm" onClick={() => setShowMarkAllModal(false)}>Cancelar</Button>
                   <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleMarkAllAsOk}>Sí, marcar todo</Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  )
}

