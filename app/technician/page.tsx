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
import { getServiceOrdersByTechnicianId, getServiceOrders, getVehicles, getUsers } from '@/lib/db';
import { getClients, getReports, updateServiceOrder, createStateHistory } from '@/lib/db';
import type { Report, ServiceState, Client } from '@/lib/types';
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from '@/lib/utils-service';
import type { ServiceOrder, Vehicle } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function TechnicianPage() {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<ServiceOrder[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<ServiceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    const [myOrders, allOrders, allVehicles, allReports, allClients] = await Promise.all([
      getServiceOrdersByTechnicianId(user.id),
      getServiceOrders(),
      getVehicles(),
      getReports(),
      getClients()
    ]);
    
    const unassigned = allOrders.filter(o => !o.technicianId);
    
    setAssignedOrders(myOrders.filter(o => o.state !== 'delivered'));
    setUnassignedOrders(unassigned.filter(o => o.state !== 'delivered'));
    setVehicles(allVehicles);
    setReports(allReports);
    setClients(allClients);
  };

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Desconocido";
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = async (e: React.DragEvent, targetState: ServiceState) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');

    if (!draggedOrderId || !user) return;

    const allOrders = await getServiceOrders();
    const order = allOrders.find((o) => o.id === draggedOrderId);
    if (!order || order.state === targetState) {
      setDraggedOrderId(null);
      return;
    }

    try {
      // Crear historial de estado
      await createStateHistory({
        serviceOrderId: order.id,
        previousState: order.state,
        newState: targetState,
        changedBy: user.id,
        notes: `Estado: ${SERVICE_STATE_LABELS[targetState]}`,
      });

      // Actualizar orden
      await updateServiceOrder(order.id, {
        state: targetState,
      });

      // Recargar datos
      await loadData();
    } catch (error) {
      console.error('[v0] Error moving order:', error);
    } finally {
      setDraggedOrderId(null);
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
    {
      title: 'Sin Asignar',
      value: unassignedOrders.length,
      icon: ListChecks,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
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

  const filteredUnassignedOrders = unassignedOrders.filter((order) => {
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
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assigned" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="assigned">
                    Mis Órdenes ({assignedOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="unassigned">
                    Sin Asignar ({unassignedOrders.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="assigned" className="mt-6">
                  {filteredAssignedOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{searchTerm ? "No se encontraron resultados" : "No tiene órdenes asignadas"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                      {(["reception", "quotation", "process", "quality"] as const).map((state) => {
                        const stateOrders = filteredAssignedOrders.filter((o) => o.state === state);
                        return (
                          <div
                            key={state}
                            className="flex flex-col min-w-[280px]"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, state)}
                          >
                            <div className={`p-3 rounded-t-lg ${SERVICE_STATE_COLORS[state]} mb-2`}>
                              <h3 className="font-semibold text-sm">
                                {SERVICE_STATE_LABELS[state]} ({stateOrders.length})
                              </h3>
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-1 min-h-[200px]">
                              {stateOrders.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/30">
                                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                  <p>Arrastre órdenes aquí</p>
                                </div>
                              ) : (
                                stateOrders
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .map((order) => {
                                    const vehicle = getVehicleInfo(order.vehicleId);
                                    const isDragging = draggedOrderId === order.id;
                                    return (
                                      <div
                                        key={order.id}
                                        draggable
                                        onDragStart={() => handleDragStart(order.id)}
                                        className={`cursor-move ${isDragging ? "opacity-50" : ""}`}
                                      >
                                        <Link
                                          href={`/technician/orders/${order.id}`}
                                          className="block p-3 bg-card border rounded-lg hover:shadow-md transition-all hover:border-primary/50"
                                          onClick={(e) => {
                                            if (draggedOrderId) {
                                              e.preventDefault();
                                            }
                                          }}
                                        >
                                          <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <h4 className="font-semibold text-base">
                                                {order.orderNumber || `#${order.id.slice(0, 8)}`}
                                              </h4>
                                            </div>
                                            {vehicle && (
                                              <div className="text-sm text-muted-foreground">
                                                <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                                                <p className="flex items-center gap-1">
                                                  <span>{vehicle.licensePlate}</span>
                                                </p>
                                              </div>
                                            )}
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {order.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
                                              <User className="h-4 w-4" />
                                              <span className="truncate">{getClientName(order.clientId)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <Calendar className="h-4 w-4" />
                                              <span>
                                                {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                                  month: 'short',
                                                  day: 'numeric'
                                                })}
                                              </span>
                                            </div>
                                            {order.services && order.services.length > 0 && (
                                              <div className="pt-1.5 border-t space-y-1">
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                  <ListChecks className="h-4 w-4 shrink-0" />
                                                  <span className="font-medium">
                                                    Servicios ({order.services.filter(s => s.completed).length}/{order.services.length})
                                                  </span>
                                                </div>
                                                <div className="space-y-0.5">
                                                  {order.services.slice(0, 2).map((service) => (
                                                    <div key={service.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                      {service.completed ? (
                                                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                                                      ) : (
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                      )}
                                                      <span className="truncate line-clamp-1">
                                                        {service.description}
                                                      </span>
                                                    </div>
                                                  ))}
                                                  {order.services.length > 2 && (
                                                    <p className="text-xs text-muted-foreground pl-4">
                                                      +{order.services.length - 2} más
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </Link>
                                      </div>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="unassigned" className="mt-6">
                  <div className="mb-4">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por placa, vehículo o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <OrderList 
                    orders={filteredUnassignedOrders}
                    emptyMessage={searchTerm ? "No se encontraron resultados" : "No hay órdenes sin asignar"}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Reportes Técnicos
                  </CardTitle>
                  <CardDescription>
                    Reportes de diagnóstico creados desde las órdenes de servicio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No hay reportes registrados. Cree reportes desde las órdenes de servicio.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reports
                    .sort((a, b) => {
                      // Ordenar: no resueltos primero, luego por fecha
                      if (a.resolved !== b.resolved) {
                        return a.resolved ? 1 : -1
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .slice(0, 6)
                    .map((report) => {
                      const isResolved = report.resolved ?? false
                      return (
                        <Card
                          key={report.id}
                          className={`hover:shadow-md transition-all overflow-hidden ${
                            isResolved
                              ? "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10"
                              : "border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">
                                      {report.licensePlate}
                                    </h4>
                                    <Badge variant="outline" className="text-xs">
                                      {report.category}
                                    </Badge>
                                    {isResolved ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(report.createdAt).toLocaleDateString("es-ES", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1.5 border-t border-border/50">
                                <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                                  {report.text}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  {reports.length > 6 && (
                    <div className="col-span-full text-center pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/technician/reports">
                          Ver todos los reportes ({reports.length})
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
