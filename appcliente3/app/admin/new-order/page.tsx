'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  getClients,
  saveClient,
  getVehicles,
  getUsers,
  saveServiceOrder,
  saveVehicle,
  saveStateHistory,
} from '@/lib/db';
import { generateId, generateOrderNumber } from '@/lib/utils-service';
import type { Client, Vehicle, User, ServiceOrder, StateHistory } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { compressImages, compressBlobToBase64 } from '@/lib/image-compression';

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('unassigned');
  const [description, setDescription] = useState('');

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
  });

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
  });

  const [services, setServices] = useState<string[]>(['']);
  const [intakePhotos, setIntakePhotos] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allClients = await getClients();
      const allUsers = await getUsers();
      const allVehicles = await getVehicles();
      
      const techs = allUsers.filter(u => u.role === 'technician');
      setClients(allClients);
      setTechnicians(techs);
      setVehicles(allVehicles);
      
      // Asignar el primer técnico por defecto (solo uno permitido)
      if (techs.length > 0 && selectedTechnician === 'unassigned') {
        setSelectedTechnician(techs[0].id);
      }
    } catch (error) {
      console.error('[v0] Error loading data:', error);
    }
  };

  const clientVehicles = selectedClient
    ? vehicles.filter(v => v.clientId === selectedClient)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Por favor complete los campos requeridos');
      return;
    }

    const validServices = services.filter(s => s.trim());
    if (validServices.length === 0) {
      setError('Debe agregar al menos un servicio');
      return;
    }

    setIsLoading(true);

    try {
      let clientId = selectedClient;

      if (showNewClient) {
        if (!newClient.name || !newClient.idNumber || !newClient.phone || !newClient.email) {
          setError('Por favor complete todos los campos obligatorios del cliente');
          setIsLoading(false);
          return;
        }

        const existingByIdNumber = await getClients().then(clients => 
          clients.find(c => c.idNumber === newClient.idNumber)
        );
        const existingByEmail = await getClients().then(clients => 
          clients.find(c => c.email.toLowerCase() === newClient.email.toLowerCase())
        );

        if (existingByIdNumber) {
          setError('Ya existe un cliente con esta cédula');
          setIsLoading(false);
          return;
        }

        if (existingByEmail) {
          setError('Ya existe un cliente con este correo electrónico');
          setIsLoading(false);
          return;
        }

        const client: Client = {
          id: generateId(),
          name: newClient.name,
          idNumber: newClient.idNumber,
          phone: newClient.phone,
          email: newClient.email,
          address: '', // Address is now optional
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveClient(client);
        clientId = client.id;
      }

      if (!clientId) {
        setError('Debe seleccionar o crear un cliente');
        setIsLoading(false);
        return;
      }

      let vehicleId = selectedVehicle;

      if (showNewVehicle) {
        if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
          setError('Por favor complete todos los campos del vehículo');
          setIsLoading(false);
          return;
        }

        const vehicle: Vehicle = {
          id: generateId(),
          clientId: clientId,
          ...newVehicle,
        };
        await saveVehicle(vehicle);
        vehicleId = vehicle.id;
      }

      if (!vehicleId) {
        setError('Debe seleccionar o crear un vehículo');
        setIsLoading(false);
        return;
      }

      // Obtener la placa del vehículo para generar el número de orden
      let vehicleLicensePlate = '';
      if (showNewVehicle) {
        vehicleLicensePlate = newVehicle.licensePlate;
      } else {
        const allVehicles = await getVehicles();
        const selectedVehicleObj = allVehicles.find(v => v.id === vehicleId);
        if (selectedVehicleObj) {
          vehicleLicensePlate = selectedVehicleObj.licensePlate;
        }
      }

      // Generar número de orden basado en la placa
      const orderNumber = generateOrderNumber(vehicleLicensePlate);

      // Asignar técnico: siempre usar el primer técnico disponible (solo uno permitido)
      let finalTechnicianId: string | undefined = undefined;
      if (technicians.length > 0) {
        finalTechnicianId = technicians[0].id;
      }

      const order: ServiceOrder = {
        id: generateId(),
        orderNumber,
        vehicleId,
        clientId: clientId,
        technicianId: finalTechnicianId,
        state: 'reception',
        description: description.trim(),
        services: validServices.map(desc => ({
          id: generateId(),
          description: desc,
          completed: false,
        })),
        intakePhotos: intakePhotos,
        servicePhotos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Comprimir fotos si son blob URLs, si ya son base64 comprimido las dejamos como están
      const intakePhotosBase64 = await Promise.all(
        order.intakePhotos.map(async (photo) => {
          if (photo.startsWith('blob:')) {
            // Comprimir blob URL antes de convertir
            return await compressBlobToBase64(photo, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.8,
              maxSizeKB: 500,
            });
          }
          // Si ya es base64, retornarlo directamente (ya debería estar comprimido)
          return photo;
        })
      );
      order.intakePhotos = intakePhotosBase64;

      await saveServiceOrder(order);

      const history: StateHistory = {
        id: generateId(),
        serviceOrderId: order.id,
        previousState: 'reception',
        newState: 'reception',
        changedBy: user?.id || '',
        changedAt: new Date().toISOString(),
        notes: 'Orden de servicio creada',
      };
      await saveStateHistory(history);

      router.push('/admin');
    } catch (err) {
      setError('Error al crear la orden de servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    setServices([...services, '']);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, value: string) => {
    const updated = [...services];
    updated[index] = value;
    setServices(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setIsLoading(true);
      // Comprimir las imágenes automáticamente antes de agregarlas
      const compressedPhotos = await compressImages(Array.from(files), {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSizeKB: 500, // Máximo 500KB por imagen
      });
      
      setIntakePhotos([...intakePhotos, ...compressedPhotos]);
    } catch (error) {
      console.error('[v0] Error compressing photos:', error);
      setError('Error al procesar las imágenes. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setIntakePhotos(intakePhotos.filter((_, i) => i !== index));
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Nueva Orden de Servicio">
        <div className="max-w-3xl">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Crear Orden de Servicio</CardTitle>
              <CardDescription>
                Complete los datos para registrar una nueva orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cliente *</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setShowNewClient(!showNewClient);
                        if (!showNewClient) {
                          setSelectedClient('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {showNewClient ? 'Seleccionar existente' : 'Nuevo cliente'}
                    </Button>
                  </div>

                  {showNewClient ? (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientName">Nombre Completo *</Label>
                          <Input
                            id="clientName"
                            value={newClient.name}
                            onChange={(e) =>
                              setNewClient({ ...newClient, name: e.target.value })
                            }
                            placeholder="Juan Pérez"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientIdNumber">Cédula *</Label>
                          <Input
                            id="clientIdNumber"
                            value={newClient.idNumber}
                            onChange={(e) =>
                              setNewClient({ ...newClient, idNumber: e.target.value })
                            }
                            placeholder="1234567890"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone">Teléfono *</Label>
                          <Input
                            id="clientPhone"
                            value={newClient.phone}
                            onChange={(e) =>
                              setNewClient({ ...newClient, phone: e.target.value })
                            }
                            placeholder="3001234567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail">Correo Electrónico *</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={newClient.email}
                            onChange={(e) =>
                              setNewClient({ ...newClient, email: e.target.value })
                            }
                            placeholder="cliente@ejemplo.com"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No hay clientes registrados
                          </div>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.idNumber}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {(selectedClient || showNewClient) && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Vehículo *</Label>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setShowNewVehicle(!showNewVehicle)}
                        >
                          {showNewVehicle ? 'Seleccionar existente' : 'Agregar nuevo'}
                        </Button>
                      </div>

                      {showNewVehicle ? (
                        <div className="border rounded-lg p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="brand">Marca *</Label>
                              <Input
                                id="brand"
                                value={newVehicle.brand}
                                onChange={(e) =>
                                  setNewVehicle({ ...newVehicle, brand: e.target.value })
                                }
                                placeholder="Toyota, Ford, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="model">Modelo *</Label>
                              <Input
                                id="model"
                                value={newVehicle.model}
                                onChange={(e) =>
                                  setNewVehicle({ ...newVehicle, model: e.target.value })
                                }
                                placeholder="Corolla, F-150, etc."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="year">Año</Label>
                              <Input
                                id="year"
                                type="number"
                                value={newVehicle.year}
                                onChange={(e) =>
                                  setNewVehicle({
                                    ...newVehicle,
                                    year: parseInt(e.target.value),
                                  })
                                }
                                min="1900"
                                max={new Date().getFullYear() + 1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="licensePlate">Placa *</Label>
                              <Input
                                id="licensePlate"
                                value={newVehicle.licensePlate}
                                onChange={(e) =>
                                  setNewVehicle({
                                    ...newVehicle,
                                    licensePlate: e.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="ABC123"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <Input
                              id="color"
                              value={newVehicle.color}
                              onChange={(e) =>
                                setNewVehicle({ ...newVehicle, color: e.target.value })
                              }
                              placeholder="Rojo, Azul, etc."
                            />
                          </div>
                        </div>
                      ) : (
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={showNewClient}>
                          <SelectTrigger>
                            <SelectValue placeholder={showNewClient ? "Agregue el vehículo nuevo" : "Seleccione un vehículo"} />
                          </SelectTrigger>
                          <SelectContent>
                            {clientVehicles.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                No hay vehículos registrados
                              </div>
                            ) : (
                              clientVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="technician">Técnico Asignado</Label>
                  {technicians.length === 0 ? (
                    <div className="p-3 border rounded-md bg-muted">
                      <p className="text-sm text-muted-foreground">
                        No hay técnicos registrados. Crea un técnico en la sección de Usuarios.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md bg-muted">
                      <p className="text-sm font-medium">
                        {technicians[0].name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Todas las órdenes se asignan automáticamente a este técnico.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description"> Notas Cliente *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describa el motivo del servicio o reparación..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Servicios a Realizar *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addService}>
                      Agregar Servicio
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {services.map((service, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={service}
                          onChange={(e) => updateService(index, e.target.value)}
                          placeholder="Descripción del servicio..."
                          className="flex-1"
                        />
                        {services.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeService(index)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fotos de Ingreso del Vehículo</Label>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                    />
                    {intakePhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {intakePhotos.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo || "/placeholder.svg"}
                              alt={`Foto ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(index)}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creando...' : 'Crear Orden de Servicio'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin')}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
