import type { ServiceOrder, Client, Vehicle, QuotationItem, QualityControlCheck } from "./types"

export interface VehicleReport {
  licensePlate: string
  category: string
  text: string
  notes?: string
  createdAt: string
}
import { formatCurrency } from "./utils-service"

/**
 * Genera el HTML de la factura usando la plantilla
 * @param order - Orden de servicio
 * @param client - Cliente
 * @param vehicle - Vehículo
 * @param documentType - Tipo de documento: "quotation" para cotización, "invoice" para cuenta de cobro. Si no se especifica, se determina por el estado de la orden.
 * @param note - Nota u observación opcional para incluir en el documento
 */
export function generateInvoiceHTML(
  order: ServiceOrder,
  client: Client,
  vehicle: Vehicle,
  documentType?: "quotation" | "invoice",
  note?: string,
): string {
  if (!order.quotation || !order.quotation.items.length) {
    throw new Error("La orden no tiene cotización válida")
  }

  // Cargar la plantilla
  const template = getInvoiceTemplate()

  // Calcular totales (IVA por ítem cuando incluye impuesto)
  const calc = order.quotation.items.reduce(
    (acc, item) => {
      const base = item.total
      const hasIva = item.includesTax !== false
      const itemIva = hasIva ? base * 0.19 : 0
      return {
        subtotal: acc.subtotal + base,
        tax: acc.tax + itemIva,
        total: acc.total + base + itemIva,
      }
    },
    { subtotal: 0, tax: 0, total: 0 }
  )
  const subtotal = order.quotation.subtotal ?? calc.subtotal
  const tax = order.quotation.tax ?? calc.tax
  const total = order.quotation.total ?? calc.total

  // Formatear fecha
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Generar filas de la tabla (Descripción, Cantidad, Precio Unit., IVA, Total)
  const itemsRows = order.quotation.items
    .map(
      (item: QuotationItem, index: number) => {
        const baseAmount = item.total
        const hasIva = item.includesTax !== false
        const ivaAmount = hasIva ? baseAmount * 0.19 : 0
        const rowTotal = baseAmount + ivaAmount
        const ivaCell = hasIva
          ? `<td class="text-right iva-cell">${formatCurrency(ivaAmount)}</td>`
          : `<td class="text-right">-</td>`
        return `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      ${ivaCell}
      <td class="text-right">${formatCurrency(rowTotal)}</td>
    </tr>
  `
      },
    )
    .join("")

  // Determinar el tipo de documento
  // Si se especifica documentType, usarlo; de lo contrario, determinar por el estado
  let documentTitle: string
  if (documentType === "quotation") {
    documentTitle = "Cotización"
  } else if (documentType === "invoice") {
    documentTitle = "Cuenta de Cobro"
  } else {
    // Si no se especifica, determinar por el estado
    documentTitle = order.state === "quotation" 
      ? "Cotización" 
      : "Cuenta de Cobro"
  }

  // Reemplazar placeholders en la plantilla
  let html = template
    .replace(/\{\{ORDER_NUMBER\}\}/g, order.orderNumber || order.id.slice(0, 8).toUpperCase())
    .replace(/\{\{ISSUE_DATE\}\}/g, formatDate(new Date()))
    .replace(/\{\{ORDER_STATE\}\}/g, getStateLabel(order.state))
    .replace(/\{\{DOCUMENT_TITLE\}\}/g, documentTitle)
    .replace(/\{\{CLIENT_NAME\}\}/g, escapeHtml(client.name))
    .replace(/\{\{CLIENT_ID_NUMBER\}\}/g, escapeHtml(client.idNumber))
    .replace(/\{\{CLIENT_PHONE\}\}/g, escapeHtml(client.phone))
    .replace(/\{\{CLIENT_EMAIL\}\}/g, escapeHtml(client.email))
    .replace(/\{\{CLIENT_ADDRESS\}\}/g, client.address ? escapeHtml(client.address) : "")
    .replace(/\{\{VEHICLE_BRAND\}\}/g, escapeHtml(vehicle.brand))
    .replace(/\{\{VEHICLE_MODEL\}\}/g, escapeHtml(vehicle.model))
    .replace(/\{\{VEHICLE_LICENSE_PLATE\}\}/g, escapeHtml(vehicle.licensePlate))
    .replace(/\{\{VEHICLE_COLOR\}\}/g, vehicle.color ? escapeHtml(vehicle.color) : "")
    .replace(/\{\{VEHICLE_YEAR\}\}/g, vehicle.year.toString())
    .replace(/\{\{VEHICLE_VIN\}\}/g, vehicle.vin ? escapeHtml(vehicle.vin) : "")
    .replace(/\{\{SERVICE_DESCRIPTION\}\}/g, order.description ? escapeHtml(order.description) : "")
    .replace(/\{\{ITEMS_TABLE_ROWS\}\}/g, itemsRows)
    .replace(/\{\{SUBTOTAL\}\}/g, formatCurrency(subtotal))
    .replace(/\{\{TAX\}\}/g, formatCurrency(tax))
    .replace(/\{\{TOTAL\}\}/g, formatCurrency(total))
    .replace(/\{\{GENERATION_DATE\}\}/g, formatDateTime(new Date()))
    .replace(/\{\{NOTE\}\}/g, note ? escapeHtml(note) : "")

  // Manejar secciones condicionales
  if (!client.address) {
    html = html.replace(/\{\{#CLIENT_ADDRESS\}\}[\s\S]*?\{\{\/CLIENT_ADDRESS\}\}/g, "")
  } else {
    html = html.replace(/\{\{#CLIENT_ADDRESS\}\}/g, "").replace(/\{\{\/CLIENT_ADDRESS\}\}/g, "")
  }

  if (!vehicle.color) {
    html = html.replace(/\{\{#VEHICLE_COLOR\}\}[\s\S]*?\{\{\/VEHICLE_COLOR\}\}/g, "")
  } else {
    html = html.replace(/\{\{#VEHICLE_COLOR\}\}/g, "").replace(/\{\{\/VEHICLE_COLOR\}\}/g, "")
  }

  if (!vehicle.vin) {
    html = html.replace(/\{\{#VEHICLE_VIN\}\}[\s\S]*?\{\{\/VEHICLE_VIN\}\}/g, "")
  } else {
    html = html.replace(/\{\{#VEHICLE_VIN\}\}/g, "").replace(/\{\{\/VEHICLE_VIN\}\}/g, "")
  }

  if (!order.description) {
    html = html.replace(/\{\{#SERVICE_DESCRIPTION\}\}[\s\S]*?\{\{\/SERVICE_DESCRIPTION\}\}/g, "")
  } else {
    html = html.replace(/\{\{#SERVICE_DESCRIPTION\}\}/g, "").replace(/\{\{\/SERVICE_DESCRIPTION\}\}/g, "")
  }

  if (tax <= 0) {
    html = html.replace(/\{\{#INCLUDE_TAX\}\}[\s\S]*?\{\{\/INCLUDE_TAX\}\}/g, "")
  } else {
    html = html.replace(/\{\{#INCLUDE_TAX\}\}/g, "").replace(/\{\{\/INCLUDE_TAX\}\}/g, "")
  }

  // Manejar la sección de nota/observación
  if (!note || note.trim() === "") {
    html = html.replace(/\{\{#NOTE\}\}[\s\S]*?\{\{\/NOTE\}\}/g, "")
  } else {
    html = html.replace(/\{\{#NOTE\}\}/g, "").replace(/\{\{\/NOTE\}\}/g, "")
  }

  return html
}

/**
 * Abre la factura en una ventana de impresión
 */
export function printInvoice(html: string, licensePlate: string, documentType: "quotation" | "invoice" = "invoice") {
  const printWindow = window.open("", "_blank", "width=900,height=700")
  
  if (!printWindow) {
    alert("Por favor, permite las ventanas emergentes para imprimir la factura")
    return
  }

  // Determinar el nombre del documento según el tipo
  // Si el licensePlate ya contiene "Reporte_", no agregar prefijo de factura
  let fileName: string
  if (licensePlate.startsWith("Reporte_")) {
    fileName = `${licensePlate.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
  } else {
    const documentName = documentType === "quotation" ? "Cotizacion" : "Factura"
    fileName = `${documentName}_${licensePlate.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
  }
  
  // Establecer el título de la ventana con el nombre del archivo
  printWindow.document.title = fileName

  // Modificar el HTML para incluir el nombre del archivo en el título del documento
  // Esto ayuda a que el navegador sugiera el nombre correcto al guardar como PDF
  const modifiedHtml = html.replace(
    /<title>(.*?)<\/title>/i,
    `<title>${fileName}</title>`
  )

  // Escribir el HTML en la ventana
  printWindow.document.write(modifiedHtml)
  printWindow.document.close()

  // Esperar a que el contenido se cargue completamente
  printWindow.onload = () => {
    // Pequeño delay para asegurar que todo esté renderizado
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }

  // Fallback si onload no se dispara
  setTimeout(() => {
    if (printWindow.document.readyState === "complete") {
      printWindow.focus()
      printWindow.print()
    }
  }, 500)
}

/**
 * Obtiene la plantilla HTML
 * En producción, esto podría cargarse desde un archivo o API
 */
function getInvoiceTemplate(): string {
  // Por ahora, retornamos la plantilla embebida
  // En el futuro, esto podría cargarse desde /templates/invoice-template.html
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{DOCUMENT_TITLE}} - {{ORDER_NUMBER}}</title>
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

    .services-title {
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
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
      color: #2563eb;
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

    tbody tr:nth-child(even) {
      background: transparent;
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

    td.iva-cell {
      font-weight: 700;
      color: #16a34a;
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
      <div class="document-title">{{DOCUMENT_TITLE}}</div>
    </div>

    <div class="info-box" style="margin-bottom: 15px;">
      <h3>Información de la Orden</h3>
      <p><strong>Número de Orden:</strong> {{ORDER_NUMBER}}</p>
      <p><strong>Fecha de Emisión:</strong> {{ISSUE_DATE}}</p>
      <p><strong>Estado:</strong> {{ORDER_STATE}}</p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Datos del Cliente</h3>
        <p><strong>{{CLIENT_NAME}}</strong></p>
        <p>Cédula: {{CLIENT_ID_NUMBER}}</p>
        <p>Teléfono: {{CLIENT_PHONE}}</p>
        <p>Email: {{CLIENT_EMAIL}}</p>
        {{#CLIENT_ADDRESS}}
        <p>Dirección: {{CLIENT_ADDRESS}}</p>
        {{/CLIENT_ADDRESS}}
      </div>
      <div class="info-box">
        <h3>Datos del Vehículo</h3>
        <p><strong>{{VEHICLE_BRAND}} {{VEHICLE_MODEL}}</strong></p>
        <p>Placa: {{VEHICLE_LICENSE_PLATE}}</p>
        {{#VEHICLE_COLOR}}
        <p>Color: {{VEHICLE_COLOR}}</p>
        {{/VEHICLE_COLOR}}
        <p>Año: {{VEHICLE_YEAR}}</p>
        {{#VEHICLE_VIN}}
        <p>VIN: {{VEHICLE_VIN}}</p>
        {{/VEHICLE_VIN}}
      </div>
    </div>

    {{#SERVICE_DESCRIPTION}}
    <div class="service-description">
      <h3>Descripción del Servicio</h3>
      <p>{{SERVICE_DESCRIPTION}}</p>
    </div>
    {{/SERVICE_DESCRIPTION}}

    <div class="table-container">
      <div class="services-title">Servicios Cotizados</div>
      <table>
        <thead>
          <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 45%;">Descripción</th>
            <th class="text-center" style="width: 10%;">Cantidad</th>
            <th class="text-right" style="width: 13%;">Precio Unit.</th>
            <th class="text-right" style="width: 13%;">IVA</th>
            <th class="text-right" style="width: 15%;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{ITEMS_TABLE_ROWS}}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">{{SUBTOTAL}}</span>
      </div>
      {{#INCLUDE_TAX}}
      <div class="total-row">
        <span class="total-label">IVA (19%):</span>
        <span class="total-value">{{TAX}}</span>
      </div>
      {{/INCLUDE_TAX}}
      <div class="total-row grand-total">
        <span class="total-label">TOTAL:</span>
        <span class="total-value">{{TOTAL}}</span>
      </div>
    </div>

    {{#NOTE}}
    <div class="service-description" style="margin-top: 30px;">
      <h3>Notas y Observaciones</h3>
      <p>{{NOTE}}</p>
    </div>
    {{/NOTE}}

    <div class="footer">
      <p><strong>Gracias por confiar en nuestros servicios</strong></p>
      <p>Este documento es una cuenta de cobro y no constituye factura electrónica</p>
      <p>Documento generado el {{GENERATION_DATE}}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Genera el HTML del formulario de control de calidad
 */
export function generateQualityControlHTML(
  order: ServiceOrder,
  client: Client,
  vehicle: Vehicle,
  qualityCheck: QualityControlCheck,
): string {
  const template = getQualityControlTemplate()

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  let html = template
    .replace(/\{\{ORDER_NUMBER\}\}/g, order.orderNumber || order.id.slice(0, 8).toUpperCase())
    .replace(/\{\{ISSUE_DATE\}\}/g, formatDate(new Date()))
    .replace(/\{\{CLIENT_NAME\}\}/g, escapeHtml(client.name))
    .replace(/\{\{CLIENT_ID_NUMBER\}\}/g, escapeHtml(client.idNumber))
    .replace(/\{\{CLIENT_PHONE\}\}/g, escapeHtml(client.phone))
    .replace(/\{\{VEHICLE_BRAND\}\}/g, escapeHtml(vehicle.brand))
    .replace(/\{\{VEHICLE_MODEL\}\}/g, escapeHtml(vehicle.model))
    .replace(/\{\{VEHICLE_LICENSE_PLATE\}\}/g, escapeHtml(vehicle.licensePlate))
    .replace(/\{\{VEHICLE_YEAR\}\}/g, vehicle.year.toString())
    .replace(/\{\{CHECKED_DATE\}\}/g, qualityCheck.checkedAt ? formatDateTime(qualityCheck.checkedAt) : formatDateTime(new Date()))
    .replace(/\{\{VEHICLE_CLEAN\}\}/g, qualityCheck.vehicleClean ? "✓ Sí" : "✗ No")
    .replace(/\{\{NO_TOOLS_INSIDE\}\}/g, qualityCheck.noToolsInside ? "✓ Sí" : "✗ No")
    .replace(/\{\{PROPERLY_ASSEMBLED\}\}/g, qualityCheck.properlyAssembled ? "✓ Sí" : "✗ No")
    .replace(/\{\{ISSUE_FIXED\}\}/g, qualityCheck.issueFixed ? "✓ Sí" : "✗ No")
    .replace(/\{\{ADDITIONAL_NOTES\}\}/g, qualityCheck.additionalNotes ? escapeHtml(qualityCheck.additionalNotes) : "N/A")
    .replace(/\{\{GENERATION_DATE\}\}/g, formatDateTime(new Date()))

  return html
}

/**
 * Obtiene la plantilla HTML para control de calidad
 */
function getQualityControlTemplate(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control de Calidad - {{ORDER_NUMBER}}</title>
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

    .container {
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

    .check-item {
      padding: 12px;
      margin-bottom: 10px;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
    }

    .check-item strong {
      display: block;
      margin-bottom: 5px;
      font-size: 11px;
      color: #1a1a1a;
    }

    .check-value {
      font-size: 12px;
      font-weight: 500;
    }

    .notes-section {
      margin-top: 25px;
      padding: 15px;
      background: #f8fafc;
      border-left: 4px solid #1a1a1a;
      border-radius: 4px;
    }

    .notes-section h3 {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .notes-section p {
      font-size: 11px;
      color: #4a4a4a;
      line-height: 1.6;
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

      .container {
        padding: 20px;
        max-width: 100%;
      }

      @page {
        margin: 1.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="document-title">Control de Calidad</div>
    </div>

    <div class="info-box" style="margin-bottom: 15px;">
      <h3>Información de la Orden</h3>
      <p><strong>Número de Orden:</strong> {{ORDER_NUMBER}}</p>
      <p><strong>Fecha de Verificación:</strong> {{CHECKED_DATE}}</p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Datos del Cliente</h3>
        <p><strong>{{CLIENT_NAME}}</strong></p>
        <p>Cédula: {{CLIENT_ID_NUMBER}}</p>
        <p>Teléfono: {{CLIENT_PHONE}}</p>
      </div>
      <div class="info-box">
        <h3>Datos del Vehículo</h3>
        <p><strong>{{VEHICLE_BRAND}} {{VEHICLE_MODEL}}</strong></p>
        <p>Placa: {{VEHICLE_LICENSE_PLATE}}</p>
        <p>Año: {{VEHICLE_YEAR}}</p>
      </div>
    </div>

    <div style="margin-top: 30px;">
      <h3 style="font-size: 10px; font-weight: 600; color: #1a1a1a; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">
        Verificaciones de Calidad
      </h3>

      <div class="check-item">
        <strong>1. El vehículo está limpio</strong>
        <div class="check-value">{{VEHICLE_CLEAN}}</div>
      </div>

      <div class="check-item">
        <strong>2. El vehículo no tiene herramientas adentro</strong>
        <div class="check-value">{{NO_TOOLS_INSIDE}}</div>
      </div>

      <div class="check-item">
        <strong>3. El vehículo está correctamente armado</strong>
        <div class="check-value">{{PROPERLY_ASSEMBLED}}</div>
      </div>

      <div class="check-item">
        <strong>4. La falla ha sido corregida</strong>
        <div class="check-value">{{ISSUE_FIXED}}</div>
      </div>
    </div>

    <div class="notes-section">
      <h3>Notas Adicionales</h3>
      <p>{{ADDITIONAL_NOTES}}</p>
    </div>

    <div class="footer">
      <p><strong>Control de Calidad Completado</strong></p>
      <p>Documento generado el {{GENERATION_DATE}}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Genera el HTML del reporte de vehículo
 */
export function generateVehicleReportHTML(
  reports: VehicleReport[] | VehicleReport,
  vehicle: Vehicle,
  client?: Client,
  generalNotes?: string,
): string {
  const template = getVehicleReportTemplate()

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Normalizar a array
  const reportsArray = Array.isArray(reports) ? reports : [reports]
  
  // Obtener la fecha del primer reporte o usar la fecha actual
  const reportDate = reportsArray.length > 0 && reportsArray[0].createdAt 
    ? formatDateTime(reportsArray[0].createdAt)
    : formatDateTime(new Date())

  // Generar HTML para cada reporte
  const reportsHTML = reportsArray.map((report, index) => {
    return `
      <div class="report-item" style="margin-bottom: ${index < reportsArray.length - 1 ? '25px' : '0'};">
        <div class="category-badge">${escapeHtml(report.category)}</div>
        <div class="report-text">${escapeHtml(report.text)}</div>
      </div>
    `
  }).join('')

  let html = template
    .replace(/\{\{REPORT_DATE\}\}/g, reportDate)
    .replace(/\{\{VEHICLE_BRAND\}\}/g, escapeHtml(vehicle.brand))
    .replace(/\{\{VEHICLE_MODEL\}\}/g, escapeHtml(vehicle.model))
    .replace(/\{\{VEHICLE_LICENSE_PLATE\}\}/g, escapeHtml(vehicle.licensePlate))
    .replace(/\{\{VEHICLE_COLOR\}\}/g, vehicle.color ? escapeHtml(vehicle.color) : "")
    .replace(/\{\{VEHICLE_YEAR\}\}/g, vehicle.year.toString())
    .replace(/\{\{VEHICLE_VIN\}\}/g, vehicle.vin ? escapeHtml(vehicle.vin) : "")
    .replace(/\{\{REPORTS_LIST\}\}/g, reportsHTML)
    .replace(/\{\{REPORT_NOTES\}\}/g, generalNotes ? escapeHtml(generalNotes) : "")
    .replace(/\{\{GENERATION_DATE\}\}/g, formatDateTime(new Date()))

  // Datos del cliente si están disponibles
  if (client) {
    html = html
      .replace(/\{\{CLIENT_NAME\}\}/g, escapeHtml(client.name))
      .replace(/\{\{CLIENT_ID_NUMBER\}\}/g, escapeHtml(client.idNumber))
      .replace(/\{\{CLIENT_PHONE\}\}/g, escapeHtml(client.phone))
      .replace(/\{\{CLIENT_EMAIL\}\}/g, escapeHtml(client.email))
      .replace(/\{\{CLIENT_ADDRESS\}\}/g, client.address ? escapeHtml(client.address) : "")
  } else {
    html = html.replace(/\{\{CLIENT_NAME\}\}/g, "N/A")
      .replace(/\{\{CLIENT_ID_NUMBER\}\}/g, "N/A")
      .replace(/\{\{CLIENT_PHONE\}\}/g, "N/A")
      .replace(/\{\{CLIENT_EMAIL\}\}/g, "N/A")
      .replace(/\{\{CLIENT_ADDRESS\}\}/g, "")
  }

  // Procesar condicionales para campos opcionales
  if (!vehicle.color) {
    html = html.replace(/\{\{#VEHICLE_COLOR\}\}[\s\S]*?\{\{\/VEHICLE_COLOR\}\}/g, "")
  } else {
    html = html.replace(/\{\{#VEHICLE_COLOR\}\}/g, "").replace(/\{\{\/VEHICLE_COLOR\}\}/g, "")
  }

  if (!vehicle.vin) {
    html = html.replace(/\{\{#VEHICLE_VIN\}\}[\s\S]*?\{\{\/VEHICLE_VIN\}\}/g, "")
  } else {
    html = html.replace(/\{\{#VEHICLE_VIN\}\}/g, "").replace(/\{\{\/VEHICLE_VIN\}\}/g, "")
  }

  if (!client?.address) {
    html = html.replace(/\{\{#CLIENT_ADDRESS\}\}[\s\S]*?\{\{\/CLIENT_ADDRESS\}\}/g, "")
  } else {
    html = html.replace(/\{\{#CLIENT_ADDRESS\}\}/g, "").replace(/\{\{\/CLIENT_ADDRESS\}\}/g, "")
  }

  if (!generalNotes) {
    html = html.replace(/\{\{#REPORT_NOTES\}\}[\s\S]*?\{\{\/REPORT_NOTES\}\}/g, "")
  } else {
    html = html.replace(/\{\{#REPORT_NOTES\}\}/g, "").replace(/\{\{\/REPORT_NOTES\}\}/g, "")
  }

  return html
}

/**
 * Obtiene la plantilla HTML para reporte de vehículo
 */
function getVehicleReportTemplate(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Vehículo - {{VEHICLE_LICENSE_PLATE}}</title>
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

    .container {
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

    .report-section {
      margin-top: 30px;
      padding: 20px;
      background: #f8fafc;
      border-left: 4px solid #1a1a1a;
      border-radius: 4px;
    }

    .report-section h3 {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .category-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #1a1a1a;
      color: white;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
    }

    .report-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e5e5;
    }

    .report-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .report-text {
      font-size: 11px;
      color: #4a4a4a;
      line-height: 1.8;
      white-space: pre-wrap;
      margin-bottom: 0;
    }

    .notes-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e5e5e5;
    }

    .notes-section h4 {
      font-size: 10px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .notes-section p {
      font-size: 11px;
      color: #4a4a4a;
      line-height: 1.6;
      white-space: pre-wrap;
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

      .container {
        padding: 20px;
        max-width: 100%;
      }

      @page {
        margin: 1.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="document-title">Reporte de Vehículo</div>
    </div>

    <div class="info-box" style="margin-bottom: 15px;">
      <h3>Información del Reporte</h3>
      <p><strong>Fecha de Emisión:</strong> {{REPORT_DATE}}</p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Datos del Cliente</h3>
        <p><strong>{{CLIENT_NAME}}</strong></p>
        <p>Cédula: {{CLIENT_ID_NUMBER}}</p>
        <p>Teléfono: {{CLIENT_PHONE}}</p>
        <p>Email: {{CLIENT_EMAIL}}</p>
        {{#CLIENT_ADDRESS}}
        <p>Dirección: {{CLIENT_ADDRESS}}</p>
        {{/CLIENT_ADDRESS}}
      </div>
      <div class="info-box">
        <h3>Datos del Vehículo</h3>
        <p><strong>{{VEHICLE_BRAND}} {{VEHICLE_MODEL}}</strong></p>
        <p>Placa: {{VEHICLE_LICENSE_PLATE}}</p>
        {{#VEHICLE_COLOR}}
        <p>Color: {{VEHICLE_COLOR}}</p>
        {{/VEHICLE_COLOR}}
        <p>Año: {{VEHICLE_YEAR}}</p>
        {{#VEHICLE_VIN}}
        <p>VIN: {{VEHICLE_VIN}}</p>
        {{/VEHICLE_VIN}}
      </div>
    </div>

    <div class="report-section">
      <h3>Reportes Técnicos</h3>
      {{REPORTS_LIST}}
      
      {{#REPORT_NOTES}}
      <div class="notes-section">
        <h4>Observaciones Generales</h4>
        <p>{{REPORT_NOTES}}</p>
      </div>
      {{/REPORT_NOTES}}
    </div>

    <div class="footer">
      <p><strong>Reporte Técnico de Vehículo</strong></p>
      <p>Documento generado el {{GENERATION_DATE}}</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    text = String(text)
  }
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Obtiene la etiqueta legible del estado
 */
function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    "in-diagnosis": "En Diagnóstico",
    "waiting-approval": "Esperando Aprobación",
    approved: "Aprobado",
    "in-progress": "En Progreso",
    completed: "Completado",
    delivered: "Entregado",
    reception: "Recepción",
    quotation: "Cotización",
    process: "En Proceso",
    quality: "Control de Calidad",
  }
  return labels[state] || state
}

