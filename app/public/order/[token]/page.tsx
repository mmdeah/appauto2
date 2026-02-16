'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Car, Calendar, Wrench, Clock, CheckCircle2, ImageIcon, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getServiceOrderByPublicToken,
  getVehicles,
  getUsers,
  getStateHistoryByOrderId,
  getClients,
} from '@/lib/storage';
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from '@/lib/utils-service';
import type { ServiceOrder, Vehicle, User as UserType, StateHistory, Client } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PublicOrderPage() {
  const params = useParams();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [technician, setTechnician] = useState<UserType | null>(null);
  const [history, setHistory] = useState<StateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [params.token]);

  const loadData = () => {
    try {
      const token = params.token as string;
      const foundOrder = getServiceOrderByPublicToken(token);
      
      if (!foundOrder) {
        setError('Orden no encontrada o enlace inválido');
        setLoading(false);
        return;
      }

      // Verificar si el vehículo ya fue entregado
      if (foundOrder.deliveredAt) {
        setError('Esta orden ya fue entregada. El enlace ya no está disponible.');
        setLoading(false);
        return;
      }

      setOrder(foundOrder);

      const allVehicles = getVehicles();
      const foundVehicle = allVehicles.find(v => v.id === foundOrder.vehicleId);
      setVehicle(foundVehicle || null);

      const allClients = getClients();
      const foundClient = allClients.find(c => c.id === foundOrder.clientId);
      setClient(foundClient || null);

      if (foundOrder.technicianId) {
        const allUsers = getUsers();
        const foundTech = allUsers.find(u => u.id === foundOrder.technicianId);
        setTechnician(foundTech || null);
      }

      const orderHistory = getStateHistoryByOrderId(foundOrder.id);
      setHistory(orderHistory.sort((a, b) => 
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      ));

      setLoading(false);
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Error al cargar la orden');
      setLoading(false);
    }
  };

  const openPhotoDialog = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error || !order || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Orden no encontrada'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedServices = order.services?.filter(s => s.completed).length || 0;
  const totalServices = order.services?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Automotriz Online SD</h1>
              <p className="text-sm text-muted-foreground">Seguimiento de tu orden de servicio</p>
            </div>
            <Badge className={`${SERVICE_STATE_COLORS[order.state]} text-sm px-3 py-1`}>
              {SERVICE_STATE_LABELS[order.state]}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    {vehicle.brand} {vehicle.model}
                  </CardTitle>
                  <CardDescription className="text-base">
                    Placa: {vehicle.licensePlate}
                  </CardDescription>
                  {client && (
                    <CardDescription className="text-sm">
                      Cliente: {client.name}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Descripción del Servicio
                </h4>
                <p className="text-base">{order.description}</p>
              </div>

              {order.diagnosis && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Diagnóstico
                    </h4>
                    <p className="text-base">{order.diagnosis}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Ingreso</p>
                    <p className="text-sm font-medium">
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Técnico Asignado</p>
                    <p className="text-sm font-medium">
                      {technician ? technician.name : 'Sin asignar'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.services && order.services.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Servicios Programados</CardTitle>
                    <CardDescription>Progreso del trabajo</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{completedServices}/{totalServices}</p>
                    <p className="text-xs text-muted-foreground">Completados</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.services.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        service.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''
                      }`}
                    >
                      {service.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={service.completed ? 'line-through text-muted-foreground' : ''}>
                        {service.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {order.quotation && (
            <Card>
              <CardHeader>
                <CardTitle>Cotización</CardTitle>
                <CardDescription>Detalle de costos del servicio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.quotation.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.unitPrice.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <p className="font-semibold">${item.total.toLocaleString('es-CO')} COP</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${order.quotation.subtotal.toLocaleString('es-CO')} COP</span>
                  </div>
                  {order.quotation.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">${order.quotation.tax.toLocaleString('es-CO')} COP</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${order.quotation.total.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {order.intakePhotos && order.intakePhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Fotos de Ingreso
                </CardTitle>
                <CardDescription>
                  Estado del vehículo al ingresar al taller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.intakePhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => openPhotoDialog(photo)}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Foto ingreso ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {order.servicePhotos && order.servicePhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Fotos del Servicio
                </CardTitle>
                <CardDescription>
                  Fotografías del trabajo realizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.servicePhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => openPhotoDialog(photo)}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Foto servicio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {order.qualityControlCheck && (
            <Card>
              <CardHeader>
                <CardTitle>Control de Calidad</CardTitle>
                <CardDescription>Verificaciones realizadas antes de completar el servicio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.vehicleClean ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Vehículo limpio</p>
                      <p className="text-xs text-muted-foreground">
                        {order.qualityControlCheck.vehicleClean ? "Verificado" : "No verificado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.noToolsInside ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Sin herramientas adentro</p>
                      <p className="text-xs text-muted-foreground">
                        {order.qualityControlCheck.noToolsInside ? "Verificado" : "No verificado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.properlyAssembled ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Correctamente armado</p>
                      <p className="text-xs text-muted-foreground">
                        {order.qualityControlCheck.properlyAssembled ? "Verificado" : "No verificado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle2 className={`h-5 w-5 ${order.qualityControlCheck.issueFixed ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Falla corregida</p>
                      <p className="text-xs text-muted-foreground">
                        {order.qualityControlCheck.issueFixed ? "Verificado" : "No verificado"}
                      </p>
                    </div>
                  </div>
                </div>

                {order.qualityControlCheck.additionalNotes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Notas Adicionales</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {order.qualityControlCheck.additionalNotes}
                    </p>
                  </div>
                )}

                {order.qualityControlCheck.checkedAt && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Verificado el: {new Date(order.qualityControlCheck.checkedAt).toLocaleString("es-CO")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Estados</CardTitle>
                <CardDescription>
                  Seguimiento del progreso de la orden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        </div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full min-h-8 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={SERVICE_STATE_COLORS[item.newState]} variant="secondary">
                            {SERVICE_STATE_LABELS[item.newState]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.changedAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista de Foto</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <img
              src={selectedPhoto || "/placeholder.svg"}
              alt="Foto ampliada"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


