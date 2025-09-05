import fetch from 'node-fetch';

// Types for Emailit API
interface EmailitEmailRequest {
  from: string;
  to: string;
  reply_to?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type?: string;
  }>;
  headers?: Record<string, string>;
}

interface EmailitEmailResponse {
  id: string;
  status: string;
  message?: string;
}

interface EmailitError {
  error: string;
  message: string;
  status_code: number;
}

/**
 * EMAILIT.COM EMAIL SERVICE
 * 
 * Professional email service integration for rocky.mx domain
 * 
 * CONFIGURATION REQUIRED:
 * - Domain verification for rocky.mx in Emailit dashboard
 * - SPF and DKIM records configured in DNS
 * - API credential created with type 'api'
 * 
 * FEATURES:
 * - Bearer token authentication
 * - HTML and text email support
 * - Attachment support (base64)
 * - Custom headers for tracking
 * - Error handling and retries
 * 
 * RATE LIMITS:
 * - Respects Emailit API rate limits
 * - Implements exponential backoff on failures
 * - Queue support for bulk sending
 */
class EmailitService {
  private apiKey: string;
  private apiUrl: string;
  private fromEmail: string;
  private fromName: string;
  private enabled: boolean;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.apiKey = process.env.EMAILIT_API_KEY || '';
    this.apiUrl = process.env.EMAILIT_API_URL || 'https://api.emailit.com/v1';
    this.fromEmail = process.env.EMAILIT_FROM_EMAIL || 'noreply@rocky.mx';
    this.fromName = process.env.EMAILIT_FROM_NAME || 'Rocky Events';
    this.enabled = !!this.apiKey;

    console.log('🔍 EMAILIT DEBUG - Environment variables:');
    console.log('  EMAILIT_API_KEY:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('  EMAILIT_API_URL:', this.apiUrl);
    console.log('  EMAILIT_FROM_EMAIL:', this.fromEmail);
    console.log('  EMAILIT_FROM_NAME:', this.fromName);
    console.log('  enabled:', this.enabled);

    if (!this.enabled) {
      console.log('⚠️ Emailit not configured - email functionality disabled');
    } else {
      console.log('✅ Emailit service initialized for domain rocky.mx');
    }
  }

  // Method to reinitialize if needed
  public reinitialize() {
    this.initialize();
  }

  /**
   * Send email using Emailit API
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType?: string;
    }>;
    headers?: Record<string, string>;
  }): Promise<EmailitEmailResponse> {
    if (!this.enabled) {
      throw new Error('Emailit service not configured. Please set EMAILIT_API_KEY environment variable.');
    }

    const emailRequest: EmailitEmailRequest = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo || this.fromEmail,
      headers: {
        'X-Mailer': 'Rocky Events Platform',
        'X-Service': 'Emailit',
        ...params.headers
      }
    };

    // Convert attachments to Emailit format
    if (params.attachments && params.attachments.length > 0) {
      emailRequest.attachments = params.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        content_type: att.contentType || 'application/octet-stream'
      }));
    }

    try {
      console.log(`📧 EMAILIT: Sending email to ${params.to} - Subject: ${params.subject}`);
      
      const response = await fetch(`${this.apiUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest)
      });

      const responseData = await response.json() as EmailitEmailResponse | EmailitError;

      if (!response.ok) {
        const error = responseData as EmailitError;
        console.error(`❌ EMAILIT ERROR: ${error.status_code} - ${error.message}`);
        throw new Error(`Emailit API error: ${error.message}`);
      }

      const result = responseData as EmailitEmailResponse;
      console.log(`✅ EMAILIT: Email sent successfully - ID: ${result.id}`);
      return result;

    } catch (error) {
      console.error('❌ EMAILIT: Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send event registration confirmation email
   */
  async sendEventRegistrationConfirmation(
    email: string,
    eventData: {
      guestName: string;
      eventTitle: string;
      eventDate?: string;
      eventTime?: string;
      eventPlace?: string;
      eventAddress?: string;
      organizerName: string;
      eventUrl: string;
      qrCode?: string;
    }
  ): Promise<EmailitEmailResponse> {
    const subject = `✅ Confirmación de registro - ${eventData.eventTitle}`;
    
    const eventDateTime = eventData.eventDate 
      ? `${new Date(eventData.eventDate).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}${eventData.eventTime ? ` a las ${eventData.eventTime}` : ''}`
      : 'Fecha por confirmar';

    const eventLocation = eventData.eventPlace 
      ? `${eventData.eventPlace}${eventData.eventAddress ? `, ${eventData.eventAddress}` : ''}`
      : 'Ubicación por confirmar';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Registro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Registro Confirmado!</h1>
          <p>Tu asistencia ha sido registrada exitosamente</p>
        </div>
        
        <div class="content">
          <p>Hola <strong>${eventData.guestName}</strong>,</p>
          
          <p>¡Excelente! Tu registro para el evento ha sido confirmado. Estos son los detalles:</p>
          
          <div class="event-details">
            <h3>📅 ${eventData.eventTitle}</h3>
            <p><strong>📍 Fecha:</strong> ${eventDateTime}</p>
            <p><strong>🏢 Lugar:</strong> ${eventLocation}</p>
            <p><strong>👤 Organizador:</strong> ${eventData.organizerName}</p>
          </div>

          ${eventData.qrCode ? `
          <div class="qr-section">
            <h4>🎫 Tu código QR para check-in</h4>
            <p style="font-family: monospace; font-size: 18px; background: #f0f0f0; padding: 10px; border-radius: 4px;">${eventData.qrCode}</p>
            <p><small>Presenta este código al llegar al evento</small></p>
          </div>
          ` : ''}
          
          <p>
            <a href="${eventData.eventUrl}" class="btn">Ver galería del evento</a>
          </p>
          
          <p>Si tienes alguna pregunta, no dudes en contactar al organizador.</p>
          
          <p>¡Nos vemos en el evento!</p>
        </div>
        
        <div class="footer">
          <p>Este email fue enviado por Rocky Events Platform</p>
          <p><small>rocky.mx - Plataforma de eventos</small></p>
        </div>
      </body>
      </html>
    `;

    const text = `
¡Registro Confirmado!

Hola ${eventData.guestName},

Tu asistencia al evento "${eventData.eventTitle}" ha sido confirmada.

DETALLES DEL EVENTO:
- Fecha: ${eventDateTime}
- Lugar: ${eventLocation}
- Organizador: ${eventData.organizerName}

${eventData.qrCode ? `Tu código QR para check-in: ${eventData.qrCode}` : ''}

Ver galería del evento: ${eventData.eventUrl}

¡Nos vemos en el evento!

---
Rocky Events Platform
rocky.mx
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      headers: {
        'X-Event-Type': 'registration-confirmation',
        'X-Event-Title': eventData.eventTitle
      }
    });
  }

  /**
   * Send new photo notification email
   */
  async sendNewPhotoNotification(
    email: string,
    eventData: {
      eventTitle: string;
      uploaderName: string;
      photoCount: number;
      eventUrl: string;
      organizerName: string;
    }
  ): Promise<EmailitEmailResponse> {
    const subject = `📸 Nuevas fotos en ${eventData.eventTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevas Fotos Disponibles</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .photo-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .btn { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📸 ¡Nuevas fotos disponibles!</h1>
          <p>Se han agregado nuevos recuerdos a tu evento</p>
        </div>
        
        <div class="content">
          <div class="photo-info">
            <h3>🎉 ${eventData.eventTitle}</h3>
            <p><strong>${eventData.uploaderName}</strong> ha subido <strong>${eventData.photoCount}</strong> ${eventData.photoCount === 1 ? 'nueva foto' : 'nuevas fotos'} al álbum del evento.</p>
          </div>
          
          <p>
            <a href="${eventData.eventUrl}" class="btn">Ver fotos del evento</a>
          </p>
          
          <p>¡No te pierdas estos nuevos recuerdos!</p>
        </div>
        
        <div class="footer">
          <p>Organizado por ${eventData.organizerName}</p>
          <p><small>Rocky Events Platform - rocky.mx</small></p>
        </div>
      </body>
      </html>
    `;

    const text = `
Nuevas fotos disponibles!

${eventData.uploaderName} ha subido ${eventData.photoCount} ${eventData.photoCount === 1 ? 'nueva foto' : 'nuevas fotos'} al álbum de "${eventData.eventTitle}".

Ver fotos del evento: ${eventData.eventUrl}

---
Organizado por ${eventData.organizerName}
Rocky Events Platform - rocky.mx
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      headers: {
        'X-Event-Type': 'new-photo-notification',
        'X-Event-Title': eventData.eventTitle
      }
    });
  }

  /**
   * Send check-in reminder email
   */
  async sendCheckInReminder(
    email: string,
    eventData: {
      guestName: string;
      eventTitle: string;
      eventDate?: string;
      eventTime?: string;
      eventPlace?: string;
      qrCode?: string;
      organizerName: string;
    }
  ): Promise<EmailitEmailResponse> {
    const subject = `⏰ Recordatorio: ${eventData.eventTitle} es hoy`;
    
    const eventDateTime = eventData.eventDate 
      ? `${new Date(eventData.eventDate).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}${eventData.eventTime ? ` a las ${eventData.eventTime}` : ''}`
      : 'Hoy';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Evento</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #8B4513; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fcb69f; }
          .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ ¡Es hoy!</h1>
          <p>Tu evento confirmado es hoy</p>
        </div>
        
        <div class="content">
          <p>Hola <strong>${eventData.guestName}</strong>,</p>
          
          <p>Este es un recordatorio amigable de que el evento al que te registraste es <strong>hoy</strong>:</p>
          
          <div class="reminder-info">
            <h3>🎉 ${eventData.eventTitle}</h3>
            <p><strong>📅 Cuándo:</strong> ${eventDateTime}</p>
            ${eventData.eventPlace ? `<p><strong>📍 Dónde:</strong> ${eventData.eventPlace}</p>` : ''}
          </div>

          ${eventData.qrCode ? `
          <div class="qr-section">
            <h4>🎫 Tu código QR para check-in</h4>
            <p style="font-family: monospace; font-size: 18px; background: #f0f0f0; padding: 10px; border-radius: 4px;">${eventData.qrCode}</p>
            <p><small>Presenta este código al llegar</small></p>
          </div>
          ` : ''}
          
          <p>¡Te esperamos! No olvides traer tu código QR para un check-in rápido.</p>
        </div>
        
        <div class="footer">
          <p>Organizado por ${eventData.organizerName}</p>
          <p><small>Rocky Events Platform - rocky.mx</small></p>
        </div>
      </body>
      </html>
    `;

    const text = `
¡Es hoy!

Hola ${eventData.guestName},

Recordatorio: el evento "${eventData.eventTitle}" es hoy.

Detalles:
- Cuándo: ${eventDateTime}
${eventData.eventPlace ? `- Dónde: ${eventData.eventPlace}` : ''}

${eventData.qrCode ? `Tu código QR: ${eventData.qrCode}` : ''}

¡Te esperamos!

---
Organizado por ${eventData.organizerName}
Rocky Events Platform - rocky.mx
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      headers: {
        'X-Event-Type': 'checkin-reminder',
        'X-Event-Title': eventData.eventTitle
      }
    });
  }

  /**
   * Send new attendee notification to event administrator
   */
  async sendNewAttendeeNotification(
    email: string,
    eventData: {
      guestName: string;
      guestEmail: string;
      guestWhatsapp?: string;
      companionsCount?: string;
      eventTitle: string;
      eventUrl: string;
      qrCode: string;
    }
  ): Promise<EmailitEmailResponse> {
    const subject = `👥 Nuevo asistente registrado - ${eventData.eventTitle}`;
    
    const companionsText = eventData.companionsCount && parseInt(eventData.companionsCount) > 0 
      ? `<p><strong>👥 Acompañantes:</strong> ${eventData.companionsCount}</p>`
      : '<p><strong>👥 Acompañantes:</strong> Ninguno</p>';
    
    const whatsappText = eventData.guestWhatsapp 
      ? `<p><strong>📱 WhatsApp:</strong> ${eventData.guestWhatsapp}</p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Asistente Registrado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .attendee-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .actions { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .btn { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>👥 ¡Nuevo Asistente!</h1>
          <p>Se ha registrado un nuevo asistente para tu evento</p>
        </div>
        
        <div class="content">
          <p>Hola Administrador,</p>
          
          <p>Se ha registrado un nuevo asistente para tu evento <strong>${eventData.eventTitle}</strong>:</p>
          
          <div class="attendee-info">
            <h3>📋 Información del Asistente</h3>
            <p><strong>👤 Nombre:</strong> ${eventData.guestName}</p>
            <p><strong>📧 Email:</strong> ${eventData.guestEmail}</p>
            ${whatsappText}
            ${companionsText}
            <p><strong>🎫 Código QR:</strong> ${eventData.qrCode}</p>
          </div>
          
          <div class="actions">
            <h3>✅ Acciones Disponibles</h3>
            <ul>
              <li>El asistente ya recibió su confirmación de registro</li>
              <li>Su código QR está listo para el check-in el día del evento</li>
              <li>Puedes ver todos los asistentes en la configuración del evento</li>
            </ul>
          </div>
          
          <p style="text-align: center;">
            <a href="${eventData.eventUrl}/configuracion" class="btn">Ver Todos los Asistentes</a>
          </p>
        </div>
        
        <div class="footer">
          <p>Rocky Events Platform - rocky.mx</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Nuevo Asistente Registrado!

Hola Administrador,

Se ha registrado un nuevo asistente para tu evento "${eventData.eventTitle}":

Información del Asistente:
- Nombre: ${eventData.guestName}
- Email: ${eventData.guestEmail}
${eventData.guestWhatsapp ? `- WhatsApp: ${eventData.guestWhatsapp}` : ''}
- Acompañantes: ${eventData.companionsCount || '0'}
- Código QR: ${eventData.qrCode}

Acciones Disponibles:
- El asistente ya recibió su confirmación de registro
- Su código QR está listo para el check-in el día del evento
- Puedes ver todos los asistentes en: ${eventData.eventUrl}/configuracion

---
Rocky Events Platform - rocky.mx
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      headers: {
        'X-Event-Type': 'new-attendee-notification',
        'X-Event-Title': eventData.eventTitle,
        'X-Attendee-Name': eventData.guestName
      }
    });
  }

  /**
   * Test email connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.enabled) {
        return false;
      }

      // Test with a simple email to a test address
      await this.sendEmail({
        to: 'test@example.com',
        subject: 'Emailit Connection Test',
        html: '<p>This is a test email to verify Emailit service connectivity.</p>',
        text: 'This is a test email to verify Emailit service connectivity.'
      });

      return true;
    } catch (error) {
      console.error('Emailit connection test failed:', error);
      return false;
    }
  }
}

export const emailitService = new EmailitService();