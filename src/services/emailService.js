/**
 * Servicio de Envío de Correos Transaccionales (Resend)
 * Envía emails de confirmación de inscripción y notificaciones de contacto.
 * 100% nativo mediante fetch API a la REST API de Resend (sin dependencias extra).
 */

const contentStore = require('./contentStore');

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class EmailService {
  /**
   * Obtiene la configuración de Resend desde site-content o variables de entorno
   */
  getConfig() {
    const content = contentStore.getContent();
    const apiKey = content.contact?.resendApiKey || process.env.RESEND_API_KEY || '';
    const fromEmail = content.contact?.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'Kids Race <onboarding@resend.dev>';
    return { apiKey, fromEmail };
  }

  /**
   * Envía un correo transaccional vía Resend REST API
   * @param {Object} options - { to, subject, html, text }
   */
  async sendMail({ to, subject, html, text }) {
    const { apiKey, fromEmail } = this.getConfig();

    if (!apiKey) {
      console.log(`[EmailService] (Simulado - falta RESEND_API_KEY) Para: ${to} | Asunto: ${subject}`);
      return { success: true, simulated: true };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('[EmailService] Error en respuesta de Resend:', data);
        return { success: false, error: data };
      }

      console.log(`[EmailService] Correo enviado exitosamente a ${to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err) {
      console.error('[EmailService] Excepción al conectar con Resend:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Envía correo de confirmación de inscripción al participante/tutor
   * @param {Object} inscription - Datos de la inscripción
   */
  async sendInscriptionConfirmation(inscription) {
    const content = contentStore.getContent();
    const brandName = content.brand?.name || 'Kids Race 2026';
    const raceName = inscription.raceName || content.hero?.headlinePrefix || 'Gran Corrida Infantil';
    const location = content.countdown?.locationName ? `${content.countdown.locationName}, ${content.countdown.locationCity}` : 'Costanera, Puerto Varas';
    const eventDate = content.countdown?.eventDateDisplay || 'Fecha por confirmar';
    const eventTime = content.countdown?.eventTime || '09:00 AM';

    const safeBrandName = escapeHtml(brandName);
    const safeRaceName  = escapeHtml(raceName);
    const safeLocation  = escapeHtml(location);
    const safeEventDate = escapeHtml(eventDate);
    const safeEventTime = escapeHtml(eventTime);
    const safeKidName   = escapeHtml(inscription.kidName);
    const safeName      = escapeHtml(inscription.name);
    const safeDistance  = escapeHtml(inscription.distance);
    const safeTutorRut  = escapeHtml(inscription.tutorRut);
    const safeBibNumber = escapeHtml(inscription.bibNumber || '0100');
    const safeShirtSize = escapeHtml(inscription.shirtSize || '4');
    const safeKidAge    = inscription.kidAge !== null && inscription.kidAge !== undefined ? `${parseInt(inscription.kidAge, 10)} años` : 'Participante';

    const subject = `🎉 ¡Inscripción Confirmada #${safeBibNumber}! - ${safeBrandName} (${safeKidName})`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 35px 25px; text-align: center; color: #ffffff; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .title { margin: 0; font-size: 24px; font-weight: 900; }
          .content { padding: 30px 25px; }
          .greeting { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #0f172a; }
          .details-card { background: #f1f5f9; border-radius: 14px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #64748b; font-weight: 600; }
          .detail-val { font-weight: bold; color: #0f172a; }
          .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #1e40af; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">🏅 Comprobante Oficial de Inscripción</div>
            <h1 class="title">¡Bienvenido a ${safeBrandName}!</h1>
          </div>
          <div class="content">
            <div class="greeting">Hola, ${safeName} 👋</div>
            <p style="line-height: 1.6; font-size: 15px; color: #334155;">
              ¡Tenemos excelentes noticias! La inscripción para <strong>${safeKidName}</strong> ha sido recibida y confirmada exitosamente con el <strong>N° de Inscripción #${safeBibNumber}</strong>. Por favor guarda este comprobante.
            </p>

            <div class="details-card">
              <div class="detail-row" style="background: #e0f2fe; padding: 10px; border-radius: 8px; border-bottom: none; margin-bottom: 8px;">
                <span class="detail-label" style="color: #0369a1; font-weight: 900;">N° DE INSCRIPCIÓN:</span>
                <span class="detail-val" style="color: #0284c7; font-size: 18px; font-family: monospace;">#${safeBibNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pequeño Corredor/a:</span>
                <span class="detail-val">${safeKidName} (${safeKidAge})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Talla de Polera:</span>
                <span class="detail-val">Talla ${safeShirtSize}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Distancia / Categoría:</span>
                <span class="detail-val" style="color: #2563eb;">${safeDistance}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Evento:</span>
                <span class="detail-val">${safeRaceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fecha y Hora:</span>
                <span class="detail-val">${safeEventDate} • ${safeEventTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lugar de Largada:</span>
                <span class="detail-val">${safeLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tutor Responsable:</span>
                <span class="detail-val">${safeName} ${safeTutorRut ? '(RUT: ' + safeTutorRut + ')' : ''}</span>
              </div>
            </div>

            <div class="info-box">
              <strong>📸 IMPORTANTE: Conserva este comprobante</strong><br>
              Tu <strong>N° de Inscripción #${safeBibNumber}</strong> identifica a tu pequeño corredor en la base de datos oficial del evento y te servirá para retirar tu kit oficial (polera talla ${safeShirtSize}, número y pulsera).
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              Si tienes alguna duda o necesitas actualizar algún dato médico de emergencia, puedes responder directamente a este correo o contactarnos a través de nuestra web.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} ${safeBrandName} • Deporte, Familia y Sonrisas.<br>
            Este es un correo automático de confirmación.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: inscription.email,
      subject,
      html
    });
  }
}

module.exports = new EmailService();
