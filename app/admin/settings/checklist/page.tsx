"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Save, Tags } from "lucide-react"
import { getChecklistCategories, saveChecklistCategory, deleteChecklistCategory, getSpecialServices, saveSpecialService, deleteSpecialService } from "@/lib/db"
import type { ChecklistCategory, SpecialService } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function ChecklistSettingsPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [specialServices, setSpecialServices] = useState<SpecialService[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, specs] = await Promise.all([
         getChecklistCategories(),
         getSpecialServices()
      ])
      setCategories(data)
      setSpecialServices(specs)
    } catch (e) {
      toast.error("Error al cargar las categorías")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setCategories([...categories, {
      id: Date.now().toString(),
      title: "Nueva Categoría",
      isEscaner: false,
      items: []
    }])
  }

  const handleDeleteCategory = async (index: number) => {
    const cat = categories[index]
    if (cat.id && cat.id.length > 5) {
        // Assume trying to delete from DB if it looks like a real ID usually saved
        try {
            await deleteChecklistCategory(cat.id);
        } catch(e) {}
    }
    const newCats = [...categories]
    newCats.splice(index, 1)
    setCategories(newCats)
  }

  const handleUpdateCategoryList = (index: number, field: keyof ChecklistCategory, value: any) => {
    const newCats = [...categories]
    newCats[index] = { ...newCats[index], [field]: value }
    setCategories(newCats)
  }

  const handleAddItem = (categoryIndex: number) => {
    const newCats = [...categories]
    newCats[categoryIndex].items.push("Nuevo ítem")
    setCategories(newCats)
  }

  const handleUpdateItem = (categoryIndex: number, itemIndex: number, value: string) => {
    const newCats = [...categories]
    newCats[categoryIndex].items[itemIndex] = value
    setCategories(newCats)
  }

  const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
    const newCats = [...categories]
    newCats[categoryIndex].items.splice(itemIndex, 1)
    setCategories(newCats)
  }

  // --- SPECIAL SERVICES HANDLERS ---
  const handleAddSpecialService = () => {
    setSpecialServices([...specialServices, {
      id: Date.now().toString(),
      name: "Nuevo Servicio",
      categoryName: "",
      askCategory: true
    }])
  }

  const handleDeleteSpecialService = async (index: number) => {
    const ss = specialServices[index]
    if (ss.id && ss.id.length > 5 && !ss.id.startsWith('new')) {
       try { await deleteSpecialService(ss.id); } catch(e) {}
    }
    const newList = [...specialServices]
    newList.splice(index, 1)
    setSpecialServices(newList)
  }

  const handleUpdateSpecialService = (index: number, field: keyof SpecialService, value: any) => {
    const newList = [...specialServices]
    newList[index] = { ...newList[index], [field]: value }
    setSpecialServices(newList)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // json-server usually requires saving each entity individually if we mapped it like that,
      // or we can just iterate. saveChecklistCategory uses POST/PUT per item.
      for (const cat of categories) {
        await saveChecklistCategory(cat)
      }
      for (const ss of specialServices) {
        await saveSpecialService(ss)
      }
      toast.success("Configuración guardada exitosamente")
      await loadData()
    } catch (error) {
      toast.error("Error al guardar la plantilla")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout title="Configuración de Formato Revisión">
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Plantilla de Revisión General Preventiva">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
            <div>
              <h2 className="text-lg font-bold">Gestión de Categorías e Ítems</h2>
              <p className="text-sm text-muted-foreground">Configura las opciones que el técnico llenará en su revisión.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" /> Nueva Categoría
              </Button>
              <Button onClick={handleSaveAll} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>

          {categories.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <p className="text-muted-foreground">No hay categorías configuradas. Comienza añadiendo una.</p>
             </div>
          ) : (
            <div className="grid gap-6">
              {categories.map((category, catIdx) => (
                <Card key={catIdx} className="overflow-hidden shadow-sm">
                  <div className="bg-slate-100 dark:bg-slate-900 border-b p-4 flex items-center justify-between gap-4">
                     <div className="flex-1 flex flex-col gap-2">
                       <Input 
                         value={category.title}
                         onChange={(e) => handleUpdateCategoryList(catIdx, 'title', e.target.value)}
                         className="font-bold text-lg bg-white dark:bg-black w-full md:w-1/2"
                         placeholder="Ej: Frenos, Suspensión..."
                       />
                       <div className="flex items-center space-x-2 mt-1">
                          <Checkbox 
                            id={`escaner-${catIdx}`} 
                            checked={category.isEscaner} 
                            onCheckedChange={(c) => handleUpdateCategoryList(catIdx, 'isEscaner', !!c)}
                          />
                          <Label htmlFor={`escaner-${catIdx}`} className="text-sm font-medium cursor-pointer text-slate-700">
                             Habilitar módulo especial para Códigos DTC (Escáner Automotriz)
                          </Label>
                       </div>
                     </div>
                     <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(catIdx)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                  <CardContent className="p-4 bg-white dark:bg-black">
                     <div className="space-y-3">
                         {category.items.map((item, itemIdx) => (
                           <div key={itemIdx} className="flex items-center gap-3">
                             <Tags className="h-4 w-4 text-muted-foreground" />
                             <Input 
                               value={item}
                               onChange={(e) => handleUpdateItem(catIdx, itemIdx, e.target.value)}
                               placeholder="Nombre del ítem a revisar..."
                               className="flex-1"
                             />
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(catIdx, itemIdx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         ))}
                         <Button variant="secondary" size="sm" onClick={() => handleAddItem(catIdx)} className="mt-2 text-xs">
                           <Plus className="h-3 w-3 mr-1" /> Añadir ítem a {category.title}
                         </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-8 mb-4 border-t border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-blue-800 dark:text-blue-400">Panel de Servicios Especiales</h2>
                  <p className="text-sm text-muted-foreground">Configura servicios recomendados que el técnico sugerirá aparte de la inspección.</p>
                </div>
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={handleAddSpecialService}>
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Servicio
                </Button>
             </div>

             {specialServices.length === 0 ? (
                <div className="text-center py-8 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
                   <p className="text-muted-foreground">No hay servicios especiales configurados.</p>
                </div>
             ) : (
                <div className="grid gap-4">
                  {specialServices.map((ss, idx) => (
                    <Card key={idx} className="shadow-none border-blue-100 dark:border-blue-900">
                       <div className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="flex-1 space-y-2 w-full">
                             <Label className="text-xs font-bold text-blue-800">Nombre del Servicio Especial</Label>
                             <Input 
                               value={ss.name}
                               onChange={(e) => handleUpdateSpecialService(idx, 'name', e.target.value)}
                               placeholder="Ej. Sincronización, Mantenimiento Frenos..."
                             />
                          </div>
                          
                          <div className="flex-1 space-y-2 w-full">
                             <div className="flex items-center justify-between">
                               <Label className="text-xs font-bold text-slate-700">Categoría Asociada</Label>
                               <div className="flex items-center space-x-2">
                                 <Checkbox 
                                   id={`ask-${idx}`}
                                   checked={ss.askCategory}
                                   onCheckedChange={(c) => handleUpdateSpecialService(idx, 'askCategory', !!c)}
                                 />
                                 <Label htmlFor={`ask-${idx}`} className="text-[10px] cursor-pointer">Preguntar al Técnico</Label>
                               </div>
                             </div>
                             
                             <Select 
                               value={ss.askCategory ? "ASK" : (ss.categoryName || "none")}
                               onValueChange={(val) => {
                                 if (val === "ASK") {
                                   handleUpdateSpecialService(idx, 'askCategory', true)
                                 } else {
                                   handleUpdateSpecialService(idx, 'askCategory', false)
                                   handleUpdateSpecialService(idx, 'categoryName', val)
                                 }
                               }}
                             >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar comportamiento..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ASK" className="font-bold text-blue-600">PREGUNTAR AL TÉCNICO EN EL MOMENTO</SelectItem>
                                  {categories.map(c => (
                                    <SelectItem key={c.id} value={c.title}>Automático a: {c.title}</SelectItem>
                                  ))}
                                </SelectContent>
                             </Select>
                          </div>

                          <Button variant="destructive" size="icon" className="md:mt-6" onClick={() => handleDeleteSpecialService(idx)}>
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </Card>
                  ))}
                </div>
             )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
