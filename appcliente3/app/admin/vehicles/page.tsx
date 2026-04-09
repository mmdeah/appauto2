'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Car, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getVehicles, saveVehicle, getClients } from '@/lib/db';
import { generateId } from '@/lib/utils-service';
import type { Vehicle, Client } from '@/lib/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allVehicles = await getVehicles();
      const allClients = await getClients();
    setVehicles(allVehicles);
      setClients(allClients);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
      setError('Error al cargar los datos');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      color: '',
    });
    setEditingVehicle(null);
    setError('');
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      clientId: vehicle.clientId,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.clientId || !formData.brand || !formData.model || !formData.licensePlate) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
    const vehicle: Vehicle = {
      id: editingVehicle?.id || generateId(),
      clientId: formData.clientId,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: formData.year,
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      color: formData.color.trim() || undefined,
    };

      await saveVehicle(vehicle);
      await loadData();
    setIsDialogOpen(false);
    resetForm();
    } catch (error) {
      console.error('[v0] Error saving vehicle:', error);
      setError('Error al guardar el vehículo');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      try {
        const { deleteVehicle } = await import('@/lib/db');
        await deleteVehicle(vehicleId);
        await loadData();
      } catch (error) {
        console.error('[v0] Error deleting vehicle:', error);
        setError('Error al eliminar el vehículo');
      }
    }
  };


  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Gestión de Vehículos">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Vehículos Registrados</CardTitle>
                  <CardDescription>
                    Gestiona los vehículos de tus clientes
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Vehículo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                      </DialogTitle>
                      <DialogDescription>
                        Complete los datos del vehículo
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="client">Cliente *</Label>
                        <Select
                          value={formData.clientId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, clientId: value })
                          }
                        >
                          <SelectTrigger id="client">
                            <SelectValue placeholder="Seleccione un cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} - {client.idNumber} ({client.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand">Marca *</Label>
                          <Input
                            id="brand"
                            value={formData.brand}
                            onChange={(e) =>
                              setFormData({ ...formData, brand: e.target.value })
                            }
                            placeholder="Toyota, Ford, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Modelo *</Label>
                          <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) =>
                              setFormData({ ...formData, model: e.target.value })
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
                            value={formData.year}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                year: parseInt(e.target.value),
                              })
                            }
                            min="1900"
                            max={new Date().getFullYear() + 1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="licensePlate">Patente *</Label>
                          <Input
                            id="licensePlate"
                            value={formData.licensePlate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                          value={formData.color}
                          onChange={(e) =>
                            setFormData({ ...formData, color: e.target.value })
                          }
                          placeholder="Rojo, Azul, etc."
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingVehicle ? 'Guardar Cambios' : 'Crear Vehículo'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por cliente, cédula, marca, modelo o patente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay clientes registrados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {clients
                    .filter(client => {
                      // Filtrar clientes que tienen vehículos o que coinciden con la búsqueda
                      const clientVehicles = vehicles.filter(v => v.clientId === client.id);
                      if (clientVehicles.length === 0 && searchTerm) {
                        // Si no tiene vehículos pero coincide con la búsqueda, mostrarlo
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          client.name.toLowerCase().includes(searchLower) ||
                          client.idNumber.toLowerCase().includes(searchLower) ||
                          client.email.toLowerCase().includes(searchLower)
                        );
                      }
                      return true;
                    })
                    .map((client) => {
                      const clientVehicles = vehicles.filter(v => v.clientId === client.id);
                      const filteredClientVehicles = clientVehicles.filter(v =>
                        searchTerm === '' ||
                        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        client.name.toLowerCase().includes(searchTerm.toLowerCase())
                      );

                      // Si hay búsqueda y no hay vehículos que coincidan, no mostrar el cliente
                      if (searchTerm && filteredClientVehicles.length === 0 && clientVehicles.length > 0) {
                        return null;
                      }

                      return (
                        <div key={client.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <div>
                              <h3 className="font-semibold text-lg">{client.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Cédula: {client.idNumber} • Email: {client.email} • Tel: {client.phone}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {clientVehicles.length} {clientVehicles.length === 1 ? 'vehículo' : 'vehículos'}
                            </Badge>
                          </div>
                          {filteredClientVehicles.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              {clientVehicles.length === 0
                                ? 'Este cliente no tiene vehículos registrados'
                                : 'No se encontraron vehículos que coincidan con la búsqueda'}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredClientVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                                  <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                      <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                                    <div className="space-y-1 flex-1">
                                      <h4 className="font-semibold text-sm">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                          </h4>
                                      <p className="text-xs text-muted-foreground">
                            Patente: {vehicle.licensePlate}
                            {vehicle.color && ` • Color: ${vehicle.color}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
