import type { ServiceOrder, Client, Vehicle, User, StateHistory } from "./types"
import { formatCurrency } from "./utils-service"

// Mapeo de estados (duplicado del backend para uso en cliente)
const SERVICE_STATE_LABELS: Record<string, string> = {
  reception: "Recepción",
  quotation: "Cotización",
  process: "En Proceso",
  quality: "Control de Calidad",
  completed: "Completado",
  delivered: "Entregado",
}

const SERVICE_STATE_COLORS: Record<string, string> = {
  reception: "#3b82f6",
  quotation: "#8b5cf6",
  process: "#f59e0b",
  quality: "#10b981",
  completed: "#06b6d4",
  delivered: "#059669",
}

/**
 * Genera el mismo HTML que antes se enviaba por email al cliente
 * para usarlo también como documento imprimible/PDF.
 */
export function generateOrderSummaryHTML(
  order: ServiceOrder,
  client: Client,
  vehicle: Vehicle,
  technician: User | null,
  history: StateHistory[],
  customContent?: string,
): string {
  const orderNumber = order.orderNumber || `#${order.id.slice(0, 8)}`
  const baseUrl = "https://apponlinesd.up.railway.app"

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden ${orderNumber} - Automotriz Online SD</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          background: #f5f5f5;
          padding: 10px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
        }
        .header {
          background: #3b82f6;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .header h1 { font-size: 20px; margin-bottom: 5px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .content { padding: 20px; }
        .intro { margin-bottom: 20px; font-size: 14px; }
        .section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .section:last-child { border-bottom: none; }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #3b82f6;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .info-label { color: #6b7280; }
        .info-value { color: #111; font-weight: 500; }
        .service-list { margin-top: 10px; }
        .service-item {
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid #f3f4f6;
        }
        .service-item:last-child { border-bottom: none; }
        .service-completed { color: #10b981; }
        .service-pending { color: #6b7280; }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 12px;
        }
        .table th {
          background: #f9fafb;
          padding: 8px 4px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .table td {
          padding: 8px 4px;
          border-bottom: 1px solid #f3f4f6;
        }
        .table .text-right { text-align: right; }
        .table .text-center { text-align: center; }
        .totals {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #e5e7eb;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }
        .total-final {
          font-weight: 700;
          font-size: 16px;
          color: #1e40af;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid #e5e7eb;
        }
        .quality-item {
          padding: 6px 0;
          font-size: 13px;
        }
        .quality-ok { color: #10b981; }
        .quality-fail { color: #ef4444; }
        .history-item {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 12px;
        }
        .history-item:last-child { border-bottom: none; }
        .history-state {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 3px;
        }
        .history-date { color: #6b7280; font-size: 11px; }
        .cta {
          background: #f0f9ff;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
          margin-top: 20px;
        }
        .cta-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
        }
        .cta-text {
          font-size: 12px;
          color: #1e3a8a;
          margin-bottom: 10px;
        }
        .cta-button {
          display: inline-block;
          padding: 10px 20px;
          background: #3b82f6;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }
        .footer {
          background: #f9fafb;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer a { color: #3b82f6; text-decoration: none; }
        @media only screen and (max-width: 600px) {
          body { padding: 5px; }
          .header { padding: 15px; }
          .header h1 { font-size: 18px; }
          .content { padding: 15px; }
          .info-row { flex-direction: column; gap: 2px; }
          .table { font-size: 11px; }
          .table th, .table td { padding: 6px 2px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Automotriz Online SD</h1>
          <p>Orden ${orderNumber}</p>
        </div>

        <div class="content">
          <div class="intro">
            ${
              customContent ||
              `¡Hola <strong>${client.name}</strong>! Tu orden de servicio ha sido completada y está lista para ser entregada.`
            }
          </div>

          <!-- Datos del Cliente -->
          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${client.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cédula:</span>
              <span class="info-value">${client.idNumber || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${client.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${client.phone}</span>
            </div>
            ${
              client.address
                ? `
            <div class="info-row">
              <span class="info-label">Dirección:</span>
              <span class="info-value">${client.address}</span>
            </div>
            `
                : ""
            }
          </div>

          <!-- Datos del Vehículo -->
          <div class="section">
            <div class="section-title">Vehículo</div>
            <div class="info-row">
              <span class="info-label">Marca/Modelo:</span>
              <span class="info-value">${vehicle.brand} ${vehicle.model}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Año:</span>
              <span class="info-value">${vehicle.year}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Placa:</span>
              <span class="info-value"><strong>${vehicle.licensePlate}</strong></span>
            </div>
            ${
              vehicle.color
                ? `
            <div class="info-row">
              <span class="info-label">Color:</span>
              <span class="info-value">${vehicle.color}</span>
            </div>
            `
                : ""
            }
            ${
              vehicle.vin
                ? `
            <div class="info-row">
              <span class="info-label">VIN:</span>
              <span class="info-value">${vehicle.vin}</span>
            </div>
            `
                : ""
            }
          </div>

          <!-- Servicios Programados -->
          ${
            order.services && order.services.length > 0
              ? `
          <div class="section">
            <div class="section-title">Servicios (${
              order.services.filter((s) => s.completed).length
            }/${order.services.length})</div>
            <div class="service-list">
              ${order.services
                .map(
                  (service) => `
                <div class="service-item ${
                  service.completed ? "service-completed" : "service-pending"
                }">
                  ${service.completed ? "✓" : "○"} ${service.description}
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <!-- Cotización -->
          ${
            order.quotation
              ? `
          <div class="section">
            <div class="section-title">Cotización</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.quotation.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.total)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.quotation.subtotal)}</span>
              </div>
              ${
                order.quotation.tax > 0
                  ? `
              <div class="total-row">
                <span>IVA (19%):</span>
                <span>${formatCurrency(order.quotation.tax)}</span>
              </div>
              `
                  : ""
              }
              <div class="total-row total-final">
                <span>TOTAL:</span>
                <span>${formatCurrency(order.quotation.total)}</span>
              </div>
            </div>
          </div>
          `
              : ""
          }

          <!-- Control de Calidad -->
          ${
            order.qualityControlCheck
              ? `
          <div class="section">
            <div class="section-title">Control de Calidad</div>
            <div class="quality-item ${
              order.qualityControlCheck.vehicleClean ? "quality-ok" : "quality-fail"
            }">
              ${order.qualityControlCheck.vehicleClean ? "✓" : "✗"} Vehículo limpio
            </div>
            <div class="quality-item ${
              order.qualityControlCheck.noToolsInside ? "quality-ok" : "quality-fail"
            }">
              ${order.qualityControlCheck.noToolsInside ? "✓" : "✗"} Sin herramientas dentro
            </div>
            <div class="quality-item ${
              order.qualityControlCheck.properlyAssembled ? "quality-ok" : "quality-fail"
            }">
              ${order.qualityControlCheck.properlyAssembled ? "✓" : "✗"} Correctamente armado
            </div>
            <div class="quality-item ${
              order.qualityControlCheck.issueFixed ? "quality-ok" : "quality-fail"
            }">
              ${order.qualityControlCheck.issueFixed ? "✓" : "✗"} Problema solucionado
            </div>
            ${
              order.qualityControlCheck.additionalNotes
                ? `
              <div style="margin-top: 10px; padding: 8px; background: #f9fafb; border-radius: 4px; font-size: 12px;">
                <strong>Notas:</strong> ${order.qualityControlCheck.additionalNotes}
              </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }

          <!-- Historial de Estados -->
          ${
            sortedHistory && sortedHistory.length > 0
              ? `
          <div class="section">
            <div class="section-title">Historial</div>
            ${sortedHistory
              .map((item) => {
                const stateColor = SERVICE_STATE_COLORS[item.newState] || "#6b7280"
                return `
                <div class="history-item">
                  <span class="history-state" style="background: ${stateColor}">
                    ${SERVICE_STATE_LABELS[item.newState] || item.newState}
                  </span>
                  <div style="font-size: 12px; margin-top: 3px;">
                    ${
                      item.notes ||
                      `Cambio a ${SERVICE_STATE_LABELS[item.newState] || item.newState}`
                    }
                  </div>
                  <div class="history-date">
                    ${new Date(item.changedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              `
              })
              .join("")}
          </div>
          `
              : ""
          }

          <!-- CTA -->
          <div class="cta">
            <div class="cta-title">🎉 Vehículo listo para entrega</div>
            <div class="cta-text">Consulta el estado de tus órdenes en cualquier momento</div>
            <a href="${baseUrl}/client" class="cta-button">Ver mis órdenes</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>Automotriz Online SD</strong></p>
          <p>Gracias por confiar en nosotros</p>
          <p style="margin-top: 8px;">
            <a href="https://wa.me/573014697942">WhatsApp: +57 301 469 7942</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

