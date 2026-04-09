import { Resend } from 'resend';
import { generateOrderSummaryHTML } from '@/lib/order-summary-html';

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

    // Generar HTML del email con la información completa (misma plantilla que el resumen PDF)
    const emailHTML = generateOrderSummaryHTML(order, client, vehicle, technician, history, html);

    // Obtener la dirección "from" de las variables de entorno
    // Si no está configurada, usar el dominio de prueba (solo para desarrollo)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Automotriz Online SD <onboarding@resend.dev>';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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