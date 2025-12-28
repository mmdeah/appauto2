import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_U8b9MDQG_PffacmP473vsTjJda3e6nLsq');

// Mapeo de estados para el email
const SERVICE_STATE_LABELS: Record<string, string> = {
  'reception': 'Recepción',
  'quotation': 'Cotización',
  'process': 'En Proceso',
  'quality': 'Control de Calidad',
  'completed': 'Completado',
  'delivered': 'Entregado',
};

const SERVICE_STATE_COLORS: Record<string, string> = {
  'reception': '#3b82f6',
  'quotation': '#8b5cf6',
  'process': '#f59e0b',
  'quality': '#10b981',
  'completed': '#06b6d4',
  'delivered': '#059669',
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CO')} COP`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, order, client, vehicle, technician, history } = body;

    if (!to || !subject || !html) {
      return Response.json(
        { error: 'to, subject y html son requeridos' },
        { status: 400 }
      );
    }

    // Generar HTML del email con la información completa
    const emailHTML = generateOrderEmailHTML(order, client, vehicle, technician, history, html);

    const { data, error } = await resend.emails.send({
      from: 'Automotriz Online SD <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: emailHTML,
    });

    if (error) {
      console.error('Error sending email:', error);
      return Response.json(
        { error: 'Error al enviar el email', details: error },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Error in send-email route:', error);
    return Response.json(
      { error: 'Error al procesar la solicitud de email' },
      { status: 500 }
    );
  }
}

function generateOrderEmailHTML(
  order: any,
  client: any,
  vehicle: any,
  technician: any,
  history: any[],
  customContent?: string
): string {
  const orderNumber = order.orderNumber || `#${order.id.slice(0, 8)}`;
  const baseUrl = 'https://apponlinesd.up.railway.app';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden de Servicio ${orderNumber} - Automotriz Online SD</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
          padding: 20px;
        }
        .email-container {
          max-width: 680px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header .order-number {
          font-size: 18px;
          opacity: 0.95;
        }
        .content {
          padding: 30px;
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #3b82f6;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-title-icon {
          width: 24px;
          height: 24px;
          display: inline-block;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 500;
          color: #111827;
        }
        .badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          background-color: #3b82f6;
          color: white;
        }
        .service-item {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background-color: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
        }
        .service-item.completed {
          background-color: #f0fdf4;
          border-left-color: #10b981;
        }
        .service-check {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        .quotation-table th {
          background-color: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
        .quotation-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }
        .quotation-table tr:last-child td {
          border-bottom: none;
        }
        .quotation-totals {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid #e5e7eb;
        }
        .quotation-total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 16px;
        }
        .quotation-total-row.final {
          font-size: 20px;
          font-weight: 700;
          color: #1e40af;
          padding-top: 12px;
          border-top: 2px solid #e5e7eb;
          margin-top: 8px;
        }
        .quality-check {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        .quality-check.passed {
          background-color: #f0fdf4;
        }
        .quality-check-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .history-timeline {
          position: relative;
          padding-left: 32px;
        }
        .history-timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #e5e7eb;
        }
        .history-item {
          position: relative;
          margin-bottom: 24px;
        }
        .history-item::before {
          content: '';
          position: absolute;
          left: -28px;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .history-item:last-child {
          margin-bottom: 0;
        }
        .history-state {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .history-date {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .photo-item {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin-bottom: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .photo-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Automotriz Online SD</h1>
          <p class="order-number">Orden de Servicio ${orderNumber}</p>
        </div>

        <div class="content">
          ${customContent || '<p style="font-size: 16px; margin-bottom: 24px;">¡Hola <strong>' + client.name + '</strong>! Tu orden de servicio ha sido completada y está lista para ser entregada.</p>'}

          <!-- Datos del Cliente -->
          <div class="card">
            <div class="card-title">
              <span>👤</span>
              Datos del Cliente
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre</span>
                <span class="info-value">${client.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cédula</span>
                <span class="info-value">${client.idNumber || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${client.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Teléfono</span>
                <span class="info-value">${client.phone}</span>
              </div>
              ${client.address ? `
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Dirección</span>
                <span class="info-value">${client.address}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Datos del Vehículo -->
          <div class="card">
            <div class="card-title">
              <span>🚗</span>
              Datos del Vehículo
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Marca</span>
                <span class="info-value">${vehicle.brand}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Modelo</span>
                <span class="info-value">${vehicle.model}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Año</span>
                <span class="info-value">${vehicle.year}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Placa</span>
                <span class="info-value"><strong>${vehicle.licensePlate}</strong></span>
              </div>
              ${vehicle.color ? `
              <div class="info-item">
                <span class="info-label">Color</span>
                <span class="info-value">${vehicle.color}</span>
              </div>
              ` : ''}
              ${vehicle.vin ? `
              <div class="info-item">
                <span class="info-label">VIN</span>
                <span class="info-value">${vehicle.vin}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Servicios Programados -->
          ${order.services && order.services.length > 0 ? `
          <div class="card">
            <div class="card-title">
              <span>🔧</span>
              Servicios Programados
            </div>
            ${order.services.map((service: any) => `
              <div class="service-item ${service.completed ? 'completed' : ''}">
                ${service.completed ? '<span class="service-check">✅</span>' : '<span class="service-check">⏳</span>'}
                <span style="flex: 1;">${service.description}</span>
                ${service.completed && service.completedAt ? `
                  <span style="font-size: 12px; color: #6b7280;">
                    ${new Date(service.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                ` : ''}
              </div>
            `).join('')}
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280;">
                Progreso: <strong>${order.services.filter((s: any) => s.completed).length} de ${order.services.length} completados</strong>
              </p>
            </div>
          </div>
          ` : ''}

          <!-- Cotización -->
          ${order.quotation ? `
          <div class="card">
            <div class="card-title">
              <span>💰</span>
              Cotización
            </div>
            <table class="quotation-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio Unit.</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.quotation.items.map((item: any) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="quotation-totals">
              <div class="quotation-total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.quotation.subtotal)}</span>
              </div>
              ${order.quotation.tax > 0 ? `
              <div class="quotation-total-row">
                <span>IVA (19%):</span>
                <span>${formatCurrency(order.quotation.tax)}</span>
              </div>
              ` : ''}
              <div class="quotation-total-row final">
                <span>TOTAL:</span>
                <span>${formatCurrency(order.quotation.total)}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Control de Calidad -->
          ${order.qualityControlCheck ? `
          <div class="card">
            <div class="card-title">
              <span>✅</span>
              Control de Calidad
            </div>
            <div class="quality-check ${order.qualityControlCheck.vehicleClean ? 'passed' : ''}">
              ${order.qualityControlCheck.vehicleClean ? '<span class="quality-check-icon">✅</span>' : '<span class="quality-check-icon">❌</span>'}
              <span>Vehículo limpio</span>
            </div>
            <div class="quality-check ${order.qualityControlCheck.noToolsInside ? 'passed' : ''}">
              ${order.qualityControlCheck.noToolsInside ? '<span class="quality-check-icon">✅</span>' : '<span class="quality-check-icon">❌</span>'}
              <span>No hay herramientas dentro</span>
            </div>
            <div class="quality-check ${order.qualityControlCheck.properlyAssembled ? 'passed' : ''}">
              ${order.qualityControlCheck.properlyAssembled ? '<span class="quality-check-icon">✅</span>' : '<span class="quality-check-icon">❌</span>'}
              <span>Todo ensamblado correctamente</span>
            </div>
            <div class="quality-check ${order.qualityControlCheck.issueFixed ? 'passed' : ''}">
              ${order.qualityControlCheck.issueFixed ? '<span class="quality-check-icon">✅</span>' : '<span class="quality-check-icon">❌</span>'}
              <span>Problema original solucionado</span>
            </div>
            ${order.qualityControlCheck.additionalNotes ? `
              <div style="margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 6px;">
                <p style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">Notas Adicionales:</p>
                <p style="font-size: 14px; color: #374151;">${order.qualityControlCheck.additionalNotes}</p>
              </div>
            ` : ''}
            ${order.qualityControlCheck.checkedAt ? `
              <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">
                Verificado el: ${new Date(order.qualityControlCheck.checkedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            ` : ''}
          </div>
          ` : ''}

          <!-- Historial de Estados -->
          ${history && history.length > 0 ? `
          <div class="card">
            <div class="card-title">
              <span>📋</span>
              Historial de Estados
            </div>
            <div class="history-timeline">
              ${history.map((item: any) => {
                const stateColor = SERVICE_STATE_COLORS[item.newState] || '#6b7280';
                return `
                  <div class="history-item">
                    <div>
                      <span class="history-state" style="background-color: ${stateColor}; color: white;">
                        ${SERVICE_STATE_LABELS[item.newState] || item.newState}
                      </span>
                      <p style="font-size: 14px; color: #374151; margin-top: 4px;">
                        ${item.notes || `Cambio de estado a ${SERVICE_STATE_LABELS[item.newState] || item.newState}`}
                      </p>
                      <p class="history-date">
                        ${new Date(item.changedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Fotos -->
          ${(order.intakePhotos && order.intakePhotos.length > 0) || (order.servicePhotos && order.servicePhotos.length > 0) ? `
          <div class="card">
            <div class="card-title">
              <span>📸</span>
              Fotos del Servicio
            </div>
            ${order.intakePhotos && order.intakePhotos.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Fotos de Ingreso</p>
                <div class="photo-grid">
                  ${order.intakePhotos.map((photo: string) => `
                    <img src="${photo.startsWith('http') ? photo : baseUrl + photo}" alt="Foto ingreso" class="photo-item" />
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${order.servicePhotos && order.servicePhotos.length > 0 ? `
              <div>
                <p style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Fotos del Servicio</p>
                <div class="photo-grid">
                  ${order.servicePhotos.map((photo: string) => `
                    <img src="${photo.startsWith('http') ? photo : baseUrl + photo}" alt="Foto servicio" class="photo-item" />
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Información adicional -->
          <div class="card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #3b82f6;">
            <p style="font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 12px;">
              🎉 ¡Tu vehículo está listo para ser entregado!
            </p>
            <p style="font-size: 14px; color: #1e3a8a; margin-bottom: 8px;">
              Puedes ver el estado de tus órdenes en cualquier momento visitando:
            </p>
            <p style="margin-top: 12px;">
              <a href="${baseUrl}/client" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Ver mis órdenes
              </a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Automotriz Online SD</strong></p>
          <p>Gracias por confiar en nosotros</p>
          <p style="margin-top: 12px;">
            Para consultas, contáctenos:<br>
            <a href="https://wa.me/573014697942">WhatsApp: +57 301 469 7942</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
