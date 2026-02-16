'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Car, Calendar, Wrench, Clock, CheckCircle2, ImageIcon, MessageCircle, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SERVICE_STATE_LABELS, SERVICE_STATE_COLORS } from '@/lib/utils-service';
import type { ServiceOrder, Vehicle, User as UserType, StateHistory, ServiceRating } from '@/lib/types';
import { getRatingByOrderId, createRating, updateServiceOrder, updateRating } from '@/lib/db';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ClientOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [technician, setTechnician] = useState<UserType | null>(null);
  const [history, setHistory] = useState<StateHistory[]>([]);
  
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState<ServiceRating | null>(null);
  const [ratingForm, setRatingForm] = useState({
    serviceQuality: 5,
    timeliness: 5,
    communication: 5,
    cleanliness: 5,
    overall: 5,
    comments: '',
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const { getServiceOrderById, getVehicles, getUsers, getStateHistoryByOrderId } = await import('@/lib/db');
      
      const foundOrder = await getServiceOrderById(params.id as string);
      
      if (!foundOrder) {
        router.push('/client');
        return;
      }

      setOrder(foundOrder);

      const [allVehicles, allUsers, orderHistory, existingRating] = await Promise.all([
        getVehicles(),
        getUsers(),
        getStateHistoryByOrderId(foundOrder.id),
        getRatingByOrderId(foundOrder.id)
      ]);

      const foundVehicle = allVehicles.find(v => v.id === foundOrder.vehicleId);
      setVehicle(foundVehicle || null);

      if (foundOrder.technicianId) {
        const foundTech = allUsers.find(u => u.id === foundOrder.technicianId);
        setTechnician(foundTech || null);
      }

      setHistory(orderHistory.sort((a, b) => 
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      ));

      if (existingRating) {
        setRating(existingRating);
        setRatingForm({
          serviceQuality: existingRating.ratings.serviceQuality,
          timeliness: existingRating.ratings.timeliness,
          communication: existingRating.ratings.communication,
          cleanliness: existingRating.ratings.cleanliness,
          overall: existingRating.ratings.overall,
          comments: existingRating.comments || '',
        });
      }
    } catch (error) {
      console.error('[v0] Error loading order data:', error);
      router.push('/client');
    }
  };

  const handleSubmitRating = async () => {
    if (!order) return;

    try {
      const ratingData = {
        serviceOrderId: order.id,
        clientId: order.clientId,
        ratings: {
          serviceQuality: ratingForm.serviceQuality,
          timeliness: ratingForm.timeliness,
          communication: ratingForm.communication,
          cleanliness: ratingForm.cleanliness,
          overall: ratingForm.overall,
        },
        comments: ratingForm.comments,
      };

      if (rating) {
        await updateRating(rating.id, ratingData);
      } else {
        await createRating(ratingData);
      }

      // Actualizar la orden con la calificación
      await updateServiceOrder(order.id, {
        rating: {
          ...ratingData,
          id: rating?.id || Date.now().toString(),
          createdAt: rating?.createdAt || new Date().toISOString(),
          resolved: false,
        }
      });

      setRatingDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('[v0] Error submitting rating:', error);
      alert('Error al guardar la calificación. Por favor intente nuevamente.');
    }
  };

  const openPhotoDialog = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoDialogOpen(true);
  };

  if (!order || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Orden no encontrada</p>
      </div>
    );
  }

  const completedServices = order.services?.filter(s => s.completed).length || 0;
  const totalServices = order.services?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
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
                    Patente: {vehicle.licensePlate}
                  </CardDescription>
                </div>
                <Badge className={`${SERVICE_STATE_COLORS[order.state]} text-sm px-3 py-1`}>
                  {SERVICE_STATE_LABELS[order.state]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Descripción del Servicio
                </h4>
                <p className="text-base">{order.description}</p>
              </div>

              <Separator />

              {order.adminObservation && (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Observación del Taller
                      </h4>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap ml-7">
                      {order.adminObservation}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

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
                  <div className="flex justify-between text-sm">
                    <span>IVA (19%):</span>
                    <span className="font-semibold">${order.quotation.tax.toLocaleString('es-CO')} COP</span>
                  </div>
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

          {/* Botón de Contacto WhatsApp */}
          <Card>
            <CardContent className="p-6">
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const phone = '573014697942';
                  const message = `Hola, tengo dudas sobre mi vehiculo y la placa ${vehicle.licensePlate}`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Hablar con un Asesor
              </Button>
            </CardContent>
          </Card>

          {/* Sistema de Calificación */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Califica nuestro Servicio
                </CardTitle>
                <CardDescription>
                  Tu opinión nos ayuda a mejorar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rating ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Calidad del Servicio</p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${star <= rating.ratings.serviceQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Puntualidad</p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${star <= rating.ratings.timeliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Comunicación</p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${star <= rating.ratings.communication ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Limpieza</p>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${star <= rating.ratings.cleanliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {rating.comments && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Comentarios</p>
                        <p className="text-sm text-muted-foreground">{rating.comments}</p>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => setRatingDialogOpen(true)}>
                      Editar Calificación
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setRatingDialogOpen(true)} className="w-full">
                    <Star className="h-4 w-4 mr-2" />
                    Calificar Servicio
                  </Button>
                )}
              </CardContent>
            </Card>
        </div>
      </main>

      {/* Diálogo de Calificación */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Califica nuestro Servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Calidad del Servicio</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, serviceQuality: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${star <= ratingForm.serviceQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{ratingForm.serviceQuality}/5</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Puntualidad</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, timeliness: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${star <= ratingForm.timeliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{ratingForm.timeliness}/5</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Comunicación</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, communication: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${star <= ratingForm.communication ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{ratingForm.communication}/5</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Limpieza</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, cleanliness: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${star <= ratingForm.cleanliness ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{ratingForm.cleanliness}/5</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Calificación General</Label>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, overall: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${star <= ratingForm.overall ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{ratingForm.overall}/5</span>
                </div>
              </div>

              <div>
                <Label htmlFor="comments" className="mb-2 block">Comentarios (opcional)</Label>
                <Textarea
                  id="comments"
                  value={ratingForm.comments}
                  onChange={(e) => setRatingForm({ ...ratingForm, comments: e.target.value })}
                  placeholder="Comparte tus comentarios sobre el servicio..."
                  rows={4}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRatingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitRating}>
              Enviar Calificación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
