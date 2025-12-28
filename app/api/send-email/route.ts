import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_U8b9MDQG_PffacmP473vsTjJda3e6nLsq');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, order, client, vehicle } = body;

    if (!to || !subject || !html) {
      return Response.json(
        { error: 'to, subject y html son requeridos' },
        { status: 400 }
      );
    }

    // Generar HTML del email con la información de la orden
    const emailHTML = generateOrderEmailHTML(order, client, vehicle, html);

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

function generateOrderEmailHTML(order: any, client: any, vehicle: any, customContent?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden de Servicio - ${order.orderNumber || order.id.slice(0, 8)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
        }
        .section {
          margin-bottom: 25px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
        }
        .info-value {
          color: #111827;
        }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 15px;
        }
        .photo-item {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }
        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .quotation-table th,
        .quotation-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .quotation-table th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          color: #1e40af;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Automotriz Online SD</h1>
        <p>Orden de Servicio #${order.orderNumber || order.id.slice(0, 8)}</p>
      </div>

      <div class="content">
        ${customContent || '<p>Su orden de servicio ha sido completada y está lista para ser entregada.</p>'}

        <div class="section">
          <div class="section-title">Información de la Orden</div>
          <div class="info-row">
            <span class="info-label">Número de Orden:</span>
            <span class="info-value">${order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Descripción:</span>
            <span class="info-value">${order.description}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value">Entregado</span>
          </div>
          ${order.deliveredAt ? `
          <div class="info-row">
            <span class="info-label">Fecha de Entrega:</span>
            <span class="info-value">${new Date(order.deliveredAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${client.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${client.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${client.phone}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Vehículo</div>
          <div class="info-row">
            <span class="info-label">Marca:</span>
            <span class="info-value">${vehicle.brand}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Modelo:</span>
            <span class="info-value">${vehicle.model}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Placa:</span>
            <span class="info-value">${vehicle.licensePlate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Año:</span>
            <span class="info-value">${vehicle.year}</span>
          </div>
        </div>

        ${order.quotation ? `
        <div class="section">
          <div class="section-title">Cotización</div>
          <table class="quotation-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.quotation.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toLocaleString('es-CO')} COP</td>
                  <td>$${item.total.toLocaleString('es-CO')} COP</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                <td><strong>$${order.quotation.subtotal.toLocaleString('es-CO')} COP</strong></td>
              </tr>
              ${order.quotation.tax > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right;"><strong>IVA (19%):</strong></td>
                <td><strong>$${order.quotation.tax.toLocaleString('es-CO')} COP</strong></td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>TOTAL:</strong></td>
                <td><strong>$${order.quotation.total.toLocaleString('es-CO')} COP</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        ${(order.intakePhotos && order.intakePhotos.length > 0) || (order.servicePhotos && order.servicePhotos.length > 0) ? `
        <div class="section">
          <div class="section-title">Fotos del Servicio</div>
          <div class="photo-grid">
            ${order.intakePhotos ? order.intakePhotos.map((photo: string) => `
              <img src="${photo.startsWith('http') ? photo : `https://apponlinesd.up.railway.app${photo}`}" alt="Foto ingreso" class="photo-item" />
            `).join('') : ''}
            ${order.servicePhotos ? order.servicePhotos.map((photo: string) => `
              <img src="${photo.startsWith('http') ? photo : `https://apponlinesd.up.railway.app${photo}`}" alt="Foto servicio" class="photo-item" />
            `).join('') : ''}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>Gracias por confiar en Automotriz Online SD</p>
        <p>Para consultas, contáctenos al +57 301 469 7942</p>
      </div>
    </body>
    </html>
  `;
}

