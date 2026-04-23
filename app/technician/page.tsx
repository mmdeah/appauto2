'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Clock, CheckCircle2, Wrench, ListChecks, FileText, Search, AlertCircle, XCircle, User, Calendar, CheckCircle } from 'lucide-react';
import { getServiceOrdersByTechnicianId, getVehicles, getUsers, getServiceOrders, getClients, updateServiceOrder } from '@/lib/db';
import type { ServiceState, Client, ServiceOrder, Vehicle } from '@/lib/types';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { QuickPhotoUpload } from '@/components/quick-photo-upload';

export default function TechnicianPage() {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<ServiceOrder[]>([]);
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderToMarkAll, setOrderToMarkAll] = useState<ServiceOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);


  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    const [myOrders, allVehicles, allClients, allServiceOrders] = await Promise.all([
      getServiceOrdersByTechnicianId(user.id),
      getVehicles(),
      getClients(),
      getServiceOrders()
    ]);
    
    setAssignedOrders(myOrders.filter(o => o.state !== 'delivered'));
    setAllOrders(allServiceOrders);
    setVehicles(allVehicles);
    setClients(allClients);
  };

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Desconocido";
  };

  const handleMarkAllServicesCompleted = async (order: ServiceOrder) => {
    if (!order.services || order.services.length === 0) return;
    
    setIsUpdating(true);
    try {
      const updatedServices = order.services.map(s => ({ ...s, completed: true }));
      await updateServiceOrder(order.id, { services: updatedServices });
      toast.success("Todos los servicios marcados como completados");
      setOrderToMarkAll(null);
      await loadData();
    } catch (error) {
      console.error("Error al actualizar servicios:", error);
      toast.error("Error al actualizar los servicios");
    } finally {
      setIsUpdating(false);
    }
  };


  const activeOrders = assignedOrders.filter(
    o => !['completed', 'delivered'].includes(o.state)
  );
  const completedOrders = assignedOrders.filter(
    o => ['completed', 'delivered'].includes(o.state)
  );
  const inProgressOrders = assignedOrders.filter(o => o.state === 'in-progress');

  const stats = [
    {
      title: 'En Progreso',
      value: inProgressOrders.length,
      icon: Wrench,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Órdenes Activas',
      value: activeOrders.length,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Completadas',
      value: completedOrders.length,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  const filteredAssignedOrders = assignedOrders.filter((order) => {
    if (!searchTerm.trim()) return true
    const vehicle = getVehicleInfo(order.vehicleId)
    const searchLower = searchTerm.toLowerCase()
    return (
      vehicle?.licensePlate.toLowerCase().includes(searchLower) ||
      vehicle?.brand.toLowerCase().includes(searchLower) ||
      vehicle?.model.toLowerCase().includes(searchLower) ||
      order.description.toLowerCase().includes(searchLower) ||
      (order.orderNumber || order.id.slice(0, 8)).toLowerCase().includes(searchLower)
    )
  })


  const OrderList = ({ orders, emptyMessage }: { orders: ServiceOrder[], emptyMessage: string }) => (
    <>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((order) => {
              const vehicle = getVehicleInfo(order.vehicleId)
              return (
                <Link
                  key={order.id}
                  href={`/technician/orders/${order.id}`}
                  className="block p-4 bg-card border rounded-lg hover:shadow-md transition-all hover:border-primary/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'}
                        </h4>
                        {vehicle && (
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {vehicle.licensePlate}
                          </span>
                        )}
                        {order.orderNumber && (
                          <span className="text-xs text-muted-foreground">
                            #{order.orderNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Actualizada: {new Date(order.updatedAt).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge className={SERVICE_STATE_COLORS[order.state]}>
                      {SERVICE_STATE_LABELS[order.state]}
                    </Badge>
                  </div>
                </Link>
              )
            })}
        </div>
      )}
    </>
  );

  return (
    <ProtectedRoute allowedRoles={['technician']}>
      <DashboardLayout title="Panel del Técnico">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <h3 className="text-3xl font-bold">
                        {stat.value.toLocaleString()}
                      </h3>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor} ml-4`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Orders Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Órdenes de Trabajo
                  </CardTitle>
                  <CardDescription>
                    Gestione las órdenes de servicio asignadas
                  </CardDescription>
                </div>
                <QuickPhotoUpload
                  vehicles={vehicles || []}
                  orders={allOrders}
                  photoType="service"
                  onUploaded={loadData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assigned" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="assigned">
                    Mis Órdenes ({assignedOrders.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="assigned" className="mt-6">
                  {filteredAssignedOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{searchTerm ? "No se encontraron resultados" : "No tiene órdenes asignadas"}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAssignedOrders
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((order) => {
                          const vehicle = getVehicleInfo(order.vehicleId);
                          return (
                            <Link
                              key={order.id}
                              href={`/technician/orders/${order.id}`}
                              className="block p-4 bg-card border rounded-lg hover:shadow-md transition-all hover:border-primary/50"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-base">
                                      {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'}
                                    </h4>
                                    {vehicle && (
                                      <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {vehicle.licensePlate}
                                      </span>
                                    )}
                                    {order.orderNumber && (
                                      <span className="text-xs text-muted-foreground">
                                        #{order.orderNumber}
                                      </span>
                                    )}
                                    <Badge className={`${SERVICE_STATE_COLORS[order.state]} text-xs`}>
                                      {SERVICE_STATE_LABELS[order.state]}
                                    </Badge>
                                  </div>
                                  </div>
                                  
                                  {order.services && order.services.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Servicios Programados:</p>
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        {order.services.map((s) => (
                                          <div 
                                            key={s.id} 
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                              s.completed 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                          >
                                            {s.completed ? '✓ ' : ''}{s.description}
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {order.services.some(s => !s.completed) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-[10px] px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOrderToMarkAll(order);
                                          }}
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" /> Marcar todos como hechos
                                        </Button>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">

                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {getClientName(order.clientId)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(order.updatedAt).toLocaleDateString('es-ES', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {order.services && order.services.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <ListChecks className="h-3 w-3" />
                                        {order.services.filter(s => s.completed).length}/{order.services.length} servicios
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>


        </div>

        {/* Modal de Confirmación Marcar Todos */}
        {orderToMarkAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <Card className="max-w-sm w-full shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-green-600" />
                  ¿Marcar todo como hecho?
                </CardTitle>
                <CardDescription>
                  Se marcarán como finalizados todos los servicios programados para la orden de {getVehicleInfo(orderToMarkAll.vehicleId)?.licensePlate}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-200">
                  {orderToMarkAll.services?.map((s) => (
                    <div key={s.id} className="text-xs flex items-center gap-2 text-slate-600">
                      <div className={`h-2 w-2 rounded-full ${s.completed ? 'bg-green-500' : 'bg-slate-300'}`} />
                      {s.description}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setOrderToMarkAll(null)}
                    disabled={isUpdating}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => handleMarkAllServicesCompleted(orderToMarkAll)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Actualizando..." : "Sí, marcar todos"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>

    </ProtectedRoute>
  );
}
