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
import { ArrowLeft, Plus, Trash2, Download, Save } from 'lucide-react';
import Link from 'next/link';
import {
  getClients,
  saveClient,
  getVehicles,
  saveVehicle,
  saveServiceOrder,
  createRevenue,
} from '@/lib/db';
import { generateId, formatCurrency, generateOrderNumber } from '@/lib/utils-service';
import { CurrencyInput } from '@/components/currency-input';
import { generateInvoiceHTML, printInvoice } from '@/lib/invoice-generator';
import type { Client, Vehicle, QuotationItem, ServiceOrder } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function InvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
  });

  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    vin: '',
  });

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });
  const [includesTax, setIncludesTax] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allClients, allVehicles] = await Promise.all([
        getClients(),
        getVehicles(),
      ]);
      setClients(allClients);
      setVehicles(allVehicles);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
      setError('Error al cargar los datos');
    }
  };

  const clientVehicles = selectedClient
    ? vehicles.filter(v => v.clientId === selectedClient)
    : [];

  const handleAddItem = () => {
    if (!newItem.description.trim() || newItem.unitPrice <= 0) {
      setError('Por favor complete la descripción y el precio unitario');
      return;
    }

    const item: QuotationItem = {
      id: generateId(),
      description: newItem.description.trim(),
      type: "servicio",
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: newItem.quantity * newItem.unitPrice,
      includesTax: true,
    };

    setQuotationItems([...quotationItems, item]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    setError('');
  };

  const handleRemoveItem = (id: string) => {
    setQuotationItems(quotationItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setQuotationItems(
      quotationItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.idNumber || !newClient.phone || !newClient.email) {
      setError('Por favor complete todos los campos obligatorios del cliente');
      return;
    }

    try {
      const existingByIdNumber = clients.find(c => c.idNumber === newClient.idNumber);
      const existingByEmail = clients.find(c => c.email.toLowerCase() === newClient.email.toLowerCase());

      if (existingByIdNumber) {
        setError('Ya existe un cliente con esta cédula');
        return;
      }

      if (existingByEmail) {
        setError('Ya existe un cliente con este correo electrónico');
        return;
      }

      const client: Client = {
        id: generateId(),
        name: newClient.name,
        idNumber: newClient.idNumber,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedClient = await saveClient(client);
      setClients([...clients, savedClient]);
      setSelectedClient(savedClient.id);
      setShowNewClient(false);
      setNewClient({ name: '', idNumber: '', phone: '', email: '', address: '' });
      setSuccess('Cliente creado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('[v0] Error creating client:', error);
      setError('Error al crear el cliente');
    }
  };

  const handleCreateVehicle = async () => {
    if (!selectedClient) {
      setError('Debe seleccionar un cliente primero');
      return;
    }

    if (!newVehicle.brand || !newVehicle.model || !newVehicle.licensePlate) {
      setError('Por favor complete todos los campos obligatorios del vehículo');
      return;
    }

    try {
      const existingVehicle = vehicles.find(
        v => v.licensePlate.toLowerCase() === newVehicle.licensePlate.toLowerCase() && v.clientId === selectedClient
      );

      if (existingVehicle) {
        setError('Ya existe un vehículo con esta placa para este cliente');
        return;
      }

      const vehicle: Vehicle = {
        id: generateId(),
        clientId: selectedClient,
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        year: newVehicle.year,
        licensePlate: newVehicle.licensePlate.trim().toUpperCase(),
        color: newVehicle.color.trim() || undefined,
        vin: newVehicle.vin.trim() || undefined,
      };

      const savedVehicle = await saveVehicle(vehicle);
      setVehicles([...vehicles, savedVehicle]);
      setSelectedVehicle(savedVehicle.id);
      setShowNewVehicle(false);
      setNewVehicle({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        color: '',
        vin: '',
      });
      setSuccess('Vehículo creado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('[v0] Error creating vehicle:', error);
      setError('Error al crear el vehículo');
    }
  };

  const generateInvoiceHTMLForStandalone = (
    client: Client,
    vehicle: Vehicle,
    items: QuotationItem[],
    includesTax: boolean,
    serviceDescription?: string,
    notes?: string
  ): string => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = includesTax ? subtotal * 0.19 : 0;
    const total = subtotal + tax;

    const formatDate = (date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatDateTime = (date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const escapeHtml = (text: string): string => {
      if (typeof text !== 'string') {
        text = String(text);
      }
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    };

    const itemsRows = items
      .map(
        (item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-right">${formatCurrency(item.total)}</td>
    </tr>
  `
      )
      .join('');

    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const template = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta de Cobro - ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 20px;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
    }

    .header {
      text-align: left;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e5e5;
    }

    .document-title {
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .info-box {
      padding: 0;
    }

    .info-box h3 {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 6px;
    }

    .info-box p {
      margin: 5px 0;
      font-size: 11px;
      color: #4a4a4a;
    }

    .info-box strong {
      color: #1a1a1a;
      font-weight: 500;
    }

    .service-description {
      padding: 0;
      margin-bottom: 25px;
    }

    .service-description h3 {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 6px;
    }

    .service-description p {
      font-size: 11px;
      color: #4a4a4a;
      line-height: 1.5;
    }

    .table-container {
      margin: 25px 0;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    thead {
      border-bottom: 2px solid #1a1a1a;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1a1a1a;
    }

    th.text-center {
      text-align: center;
    }

    th.text-right {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid #f0f0f0;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    td {
      padding: 10px 8px;
      font-size: 11px;
      color: #4a4a4a;
    }

    td.text-center {
      text-align: center;
    }

    td.text-right {
      text-align: right;
      font-weight: 500;
    }

    .totals {
      margin-top: 25px;
      text-align: right;
    }

    .total-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .total-label {
      min-width: 90px;
      text-align: right;
      margin-right: 15px;
      color: #666;
    }

    .total-value {
      min-width: 120px;
      text-align: right;
      font-weight: 500;
      color: #1a1a1a;
    }

    .total-row.grand-total {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #1a1a1a;
      font-size: 14px;
    }

    .total-row.grand-total .total-label,
    .total-row.grand-total .total-value {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 14px;
    }

    .footer {
      margin-top: 35px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      color: #999;
      font-size: 9px;
      line-height: 1.6;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .invoice-container {
        padding: 20px;
        max-width: 100%;
      }

      .info-grid {
        page-break-inside: avoid;
      }

      table {
        page-break-inside: avoid;
      }

      .totals {
        page-break-inside: avoid;
      }

      @page {
        margin: 1.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="document-title">Cuenta de Cobro</div>
    </div>

    <div class="info-box" style="margin-bottom: 15px;">
      <h3>Información del Documento</h3>
      <p><strong>Número de Factura:</strong> ${invoiceNumber}</p>
      <p><strong>Fecha de Emisión:</strong> ${formatDate(new Date())}</p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Datos del Cliente</h3>
        <p><strong>${escapeHtml(client.name)}</strong></p>
        <p>Cédula: ${escapeHtml(client.idNumber)}</p>
        <p>Teléfono: ${escapeHtml(client.phone)}</p>
        <p>Email: ${escapeHtml(client.email)}</p>
        ${client.address ? `<p>Dirección: ${escapeHtml(client.address)}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Datos del Vehículo</h3>
        <p><strong>${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</strong></p>
        <p>Placa: ${escapeHtml(vehicle.licensePlate)}</p>
        ${vehicle.color ? `<p>Color: ${escapeHtml(vehicle.color)}</p>` : ''}
        <p>Año: ${vehicle.year}</p>
        ${vehicle.vin ? `<p>VIN: ${escapeHtml(vehicle.vin)}</p>` : ''}
      </div>
    </div>

    ${serviceDescription ? `
    <div class="service-description">
      <h3>Descripción del Servicio</h3>
      <p>${escapeHtml(serviceDescription)}</p>
    </div>
    ` : ''}

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 50%;">Descripción</th>
            <th class="text-center" style="width: 10%;">Cantidad</th>
            <th class="text-right" style="width: 17.5%;">Precio Unitario</th>
            <th class="text-right" style="width: 17.5%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">${formatCurrency(subtotal)}</span>
      </div>
      ${includesTax ? `
      <div class="total-row">
        <span class="total-label">IVA (19%):</span>
        <span class="total-value">${formatCurrency(tax)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span class="total-label">TOTAL:</span>
        <span class="total-value">${formatCurrency(total)}</span>
      </div>
    </div>

    ${notes ? `
    <div class="service-description" style="margin-top: 30px;">
      <h3>Notas y Observaciones</h3>
      <p>${escapeHtml(notes)}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Gracias por confiar en nuestros servicios</strong></p>
      <p>Este documento es una cuenta de cobro y no constituye factura electrónica</p>
      <p>Documento generado el ${formatDateTime(new Date())}</p>
    </div>
  </div>
</body>
</html>`;

    return template;
  };

  const handleDownloadPDF = async () => {
    if (!selectedClient || !selectedVehicle || quotationItems.length === 0) {
      setError('Por favor complete todos los campos requeridos y agregue al menos un servicio');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    const vehicle = vehicles.find(v => v.id === selectedVehicle);

    if (!client || !vehicle) {
      setError('Cliente o vehículo no encontrado');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generar el PDF
      const html = generateInvoiceHTMLForStandalone(
        client,
        vehicle,
        quotationItems,
        includesTax,
        serviceDescription,
        additionalNotes
      );

      printInvoice(html, vehicle.licensePlate, 'invoice');

      // Calcular totales
      const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
      const tax = includesTax ? subtotal * 0.19 : 0;
      const total = subtotal + tax;

      // Generar número de orden
      const orderNumber = generateOrderNumber(vehicle.licensePlate);

      // Crear orden de servicio en estado entregado
      const serviceOrder: ServiceOrder = {
        id: generateId(),
        orderNumber,
        vehicleId: vehicle.id,
        clientId: client.id,
        state: 'delivered',
        description: serviceDescription || 'Cuenta de cobro por servicios realizados',
        services: quotationItems.map(item => ({
          id: item.id,
          description: item.description,
          completed: true,
        })),
        quotation: {
          id: generateId(),
          items: quotationItems,
          subtotal,
          tax,
          total,
          includesTax,
          createdAt: new Date().toISOString(),
          createdBy: user?.id || 'admin',
        },
        intakePhotos: [], // Sin fotos para optimizar espacio
        servicePhotos: [], // Sin fotos para optimizar espacio
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Guardar orden de servicio
      await saveServiceOrder(serviceOrder);

      // Registrar ganancia
      if (total > 0) {
        await createRevenue({
          serviceOrderId: serviceOrder.id,
          amount: total,
          date: new Date().toISOString(),
          description: `Cuenta de Cobro ${orderNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        });
      }

      // Limpiar formulario
      setSelectedClient('');
      setSelectedVehicle('');
      setShowNewClient(false);
      setShowNewVehicle(false);
      setNewClient({ name: '', idNumber: '', phone: '', email: '', address: '' });
      setNewVehicle({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        color: '',
        vin: '',
      });
      setQuotationItems([]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0 });
      setIncludesTax(true);
      setAdditionalNotes('');
      setServiceDescription('');

      setSuccess('Factura generada, orden creada y ganancia registrada exitosamente');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('[v0] Error generating invoice:', error);
      setError('Error al generar la factura. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };


  const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
  const tax = includesTax ? subtotal * 0.19 : 0;
  const total = subtotal + tax;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Crear Cuenta de Cobro">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Link>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
                <CardDescription>Seleccione o cree un cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showNewClient ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="client">Cliente</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger id="client">
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} - {client.idNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewClient(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nuevo Cliente
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Nombre *</Label>
                      <Input
                        id="client-name"
                        value={newClient.name}
                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-idNumber">Cédula *</Label>
                      <Input
                        id="client-idNumber"
                        value={newClient.idNumber}
                        onChange={e => setNewClient({ ...newClient, idNumber: e.target.value })}
                        placeholder="Número de cédula"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-phone">Teléfono *</Label>
                        <Input
                          id="client-phone"
                          value={newClient.phone}
                          onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                          placeholder="Teléfono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-email">Email *</Label>
                        <Input
                          id="client-email"
                          type="email"
                          value={newClient.email}
                          onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-address">Dirección</Label>
                      <Input
                        id="client-address"
                        value={newClient.address}
                        onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                        placeholder="Dirección (opcional)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateClient} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cliente
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewClient(false);
                          setNewClient({ name: '', idNumber: '', phone: '', email: '', address: '' });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Vehículo */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Vehículo</CardTitle>
                <CardDescription>Seleccione o cree un vehículo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showNewVehicle ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Vehículo</Label>
                      <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={!selectedClient}>
                        <SelectTrigger id="vehicle">
                          <SelectValue placeholder={selectedClient ? 'Seleccione un vehículo' : 'Seleccione un cliente primero'} />
                        </SelectTrigger>
                        <SelectContent>
                          {clientVehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewVehicle(true)}
                      className="w-full"
                      disabled={!selectedClient}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nuevo Vehículo
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-brand">Marca *</Label>
                        <Input
                          id="vehicle-brand"
                          value={newVehicle.brand}
                          onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                          placeholder="Toyota, Ford, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-model">Modelo *</Label>
                        <Input
                          id="vehicle-model"
                          value={newVehicle.model}
                          onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                          placeholder="Corolla, F-150, etc."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-year">Año</Label>
                        <Input
                          id="vehicle-year"
                          type="number"
                          value={newVehicle.year}
                          onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
                          min="1900"
                          max={new Date().getFullYear() + 1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-licensePlate">Placa *</Label>
                        <Input
                          id="vehicle-licensePlate"
                          value={newVehicle.licensePlate}
                          onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value.toUpperCase() })}
                          placeholder="ABC123"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-color">Color</Label>
                        <Input
                          id="vehicle-color"
                          value={newVehicle.color}
                          onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })}
                          placeholder="Rojo, Azul, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-vin">VIN</Label>
                        <Input
                          id="vehicle-vin"
                          value={newVehicle.vin}
                          onChange={e => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                          placeholder="VIN (opcional)"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateVehicle} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Vehículo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewVehicle(false);
                          setNewVehicle({
                            brand: '',
                            model: '',
                            year: new Date().getFullYear(),
                            licensePlate: '',
                            color: '',
                            vin: '',
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Descripción del Servicio */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Servicio</CardTitle>
              <CardDescription>Información adicional sobre el servicio realizado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="service-description">Descripción (Opcional)</Label>
                <Textarea
                  id="service-description"
                  value={serviceDescription}
                  onChange={e => setServiceDescription(e.target.value)}
                  placeholder="Descripción detallada del servicio realizado..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Servicios/Ítems */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Realizados</CardTitle>
              <CardDescription>Agregue los servicios realizados con sus precios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotationItems.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 rounded-lg font-semibold text-sm">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Descripción</div>
                    <div className="col-span-2 text-center">Cantidad</div>
                    <div className="col-span-2 text-right">Precio Unit.</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {quotationItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg">
                      <div className="col-span-1 text-sm text-muted-foreground">{index + 1}</div>
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Descripción"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Cant."
                          className="h-9"
                          min="0"
                        />
                      </div>
                      <div className="col-span-2">
                        <CurrencyInput
                          value={item.unitPrice}
                          onChange={value => handleUpdateItem(item.id, 'unitPrice', value)}
                          placeholder="Precio"
                        />
                      </div>
                      <div className="col-span-1 text-right font-semibold text-sm">
                        {formatCurrency(item.total)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-semibold">Agregar Nuevo Servicio</Label>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="item-description" className="text-sm">
                      Descripción
                    </Label>
                    <Input
                      id="item-description"
                      value={newItem.description}
                      onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Descripción del servicio o repuesto"
                      onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="item-quantity" className="text-sm">
                        Cantidad
                      </Label>
                      <Input
                        id="item-quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                        placeholder="Cantidad"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-unitPrice" className="text-sm">
                        Precio Unitario
                      </Label>
                      <CurrencyInput
                        value={newItem.unitPrice}
                        onChange={value => setNewItem({ ...newItem, unitPrice: value })}
                        placeholder="Precio"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItem.description.trim() || newItem.unitPrice <= 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Servicio
                  </Button>
                </div>
              </div>

              {quotationItems.length > 0 && (
                <>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includesTax}
                          onChange={e => setIncludesTax(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-muted-foreground">Incluir IVA (19%)</span>
                      </label>
                    </div>
                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      {includesTax && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">IVA (19%):</span>
                          <span className="font-semibold">{formatCurrency(tax)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Notas y Observaciones</CardTitle>
              <CardDescription>Comentarios adicionales para incluir en la factura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additional-notes">Notas (Opcional)</Label>
                <Textarea
                  id="additional-notes"
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="Ej: Pago pendiente, condiciones especiales, garantía, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Genere el PDF de la factura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!selectedClient || !selectedVehicle || quotationItems.length === 0 || isLoading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? 'Procesando...' : 'Generar PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

