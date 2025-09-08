import { emailitService } from './emailit-service';
import { emailitSMTPService } from './emailit-smtp-service';

// Email service configured for Emailit only

// Email service configuration
const USE_EMAILIT = process.env.USE_EMAILIT === 'true' || !!process.env.EMAILIT_API_KEY;
const USE_EMAILIT_SMTP = process.env.EMAILIT_API_KEY?.startsWith('em_smtp_');
const USE_EMAILIT_API = process.env.EMAILIT_API_KEY?.startsWith('em_api_');

// Email service interface
export interface EmailService {
  sendEventRegistrationConfirmation(to: string, eventDetails: EventRegistrationData): Promise<void>;
  sendCheckInReminder(to: string, eventDetails: EventReminderData): Promise<void>;
  sendNewAttendeeNotification(to: string, attendeeData: NewAttendeeNotificationData): Promise<void>;
  sendMultipleAttendeesNotification(to: string, data: MultipleAttendeesNotificationData): Promise<void>;
}

// Data interfaces for email templates
export interface EventRegistrationData {
  guestName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventPlace?: string;
  eventAddress?: string;
  qrCode: string;
  eventUrl: string;
  organizerName: string;
}

export interface EventReminderData {
  guestName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventPlace?: string;
  eventAddress?: string;
  eventUrl: string;
  organizerName: string;
}


export interface NewAttendeeNotificationData {
  eventTitle: string;
  guestName: string;
  guestEmail: string;
  guestWhatsapp: string;
  companionsCount: string;
  eventUrl: string;
  qrCode: string;
}

// Nueva interfaz para notificaciones de múltiples asistentes por umbrales
export interface MultipleAttendeesNotificationData {
  eventTitle: string;
  eventUrl: string;
  organizerName: string;
  threshold: number; // Umbral alcanzado (5, 10, 20)
  totalConfirmed: number; // Total de confirmados hasta ahora
  newAttendees: Array<{
    guestName: string;
    guestEmail: string;
    guestWhatsapp?: string;
    companionsCount: string;
    confirmedAt: string;
  }>;
}

// Email templates
const createRegistrationEmailHTML = (data: EventRegistrationData): string => {
  const eventDateTime = data.eventDate && data.eventTime 
    ? `<p><strong>📅 Fecha:</strong> ${data.eventDate} a las ${data.eventTime}</p>`
    : '';
  
  const eventLocation = data.eventPlace 
    ? `<p><strong>📍 Lugar:</strong> ${data.eventPlace}${data.eventAddress ? `, ${data.eventAddress}` : ''}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Registro</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">¡Registro Confirmado!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${data.guestName}</strong>,</p>
        
        <p>Tu registro para <strong>${data.eventTitle}</strong> ha sido confirmado exitosamente.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #667eea;">📋 Detalles del Evento</h3>
          ${eventDateTime}
          ${eventLocation}
          <p><strong>👤 Organizador:</strong> ${data.organizerName}</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #1976d2;">🎫 Tu Código QR</h3>
          <p>Presenta este código el día del evento:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}" 
                 alt="QR Code: ${data.qrCode}" 
                 style="display: block; margin: 10px auto; border-radius: 8px; max-width: 200px; height: auto;" />
            <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
              <strong style="font-size: 18px; color: #1976d2; letter-spacing: 1px;">${data.qrCode}</strong>
            </div>
          </div>
          <p style="font-size: 14px; color: #666;">Escanea el código QR o presenta el código de texto</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Evento</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Este email fue enviado por el organizador del evento.<br>
          Si tienes preguntas, contacta directamente con ${data.organizerName}.
        </p>
      </div>
    </body>
    </html>
  `;
};

const createReminderEmailHTML = (data: EventReminderData): string => {
  const eventDateTime = data.eventDate && data.eventTime 
    ? `<p><strong>📅 Fecha:</strong> ${data.eventDate} a las ${data.eventTime}</p>`
    : '';
  
  const eventLocation = data.eventPlace 
    ? `<p><strong>📍 Lugar:</strong> ${data.eventPlace}${data.eventAddress ? `, ${data.eventAddress}` : ''}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recordatorio de Evento</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ ¡Recordatorio!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${data.guestName}</strong>,</p>
        
        <p>Este es un recordatorio de que tienes confirmada tu asistencia a:</p>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ff9800;">
          <h3 style="margin-top: 0; color: #e65100;">${data.eventTitle}</h3>
          ${eventDateTime}
          ${eventLocation}
          <p><strong>👤 Organizador:</strong> ${data.organizerName}</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2e7d32;">💡 Recuerda</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Lleva tu código QR de confirmación</li>
            <li>Llega puntualmente al evento</li>
            <li>¡Prepárate para compartir momentos increíbles!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventUrl}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Detalles del Evento</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          ¡Nos vemos pronto!<br>
          - ${data.organizerName}
        </p>
      </div>
    </body>
    </html>
  `;
};


const createNewAttendeeNotificationHTML = (data: NewAttendeeNotificationData): string => {
  const companionsText = data.companionsCount && parseInt(data.companionsCount) > 0 
    ? `<p><strong>👥 Acompañantes:</strong> ${data.companionsCount}</p>`
    : '<p><strong>👥 Acompañantes:</strong> Ninguno</p>';
  
  const whatsappText = data.guestWhatsapp 
    ? `<p><strong>📱 WhatsApp:</strong> ${data.guestWhatsapp}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Asistente Registrado</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">👥 ¡Nuevo Asistente!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hola Administrador,</p>
        
        <p>Se ha registrado un nuevo asistente para tu evento <strong>${data.eventTitle}</strong>:</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">📋 Información del Asistente</h3>
          <p><strong>👤 Nombre:</strong> ${data.guestName}</p>
          <p><strong>📧 Email:</strong> ${data.guestEmail}</p>
          ${whatsappText}
          ${companionsText}
          <p><strong>🎫 Código QR:</strong> ${data.qrCode}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #6c757d;">✅ Acciones Disponibles</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>El asistente ya recibió su confirmación de registro</li>
            <li>Su código QR está listo para el check-in el día del evento</li>
            <li>Puedes ver todos los asistentes en la configuración del evento</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventUrl}/configuracion" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Todos los Asistentes</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          Esta notificación se envió automáticamente desde tu sistema de gestión de eventos.
        </p>
      </div>
    </body>
    </html>
  `;
};

// ResendEmailService removed - using Emailit only

// Emailit SMTP Service Implementation
export class EmailitSMTPServiceAdapter implements EmailService {
  async sendEventRegistrationConfirmation(to: string, data: EventRegistrationData): Promise<void> {
    try {
      console.log('📧 EMAILIT SMTP: Sending registration email');
      
      const eventDateTime = data.eventDate && data.eventTime 
        ? `${new Date(data.eventDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las ${data.eventTime}`
        : 'Fecha por confirmar';

      const eventLocation = data.eventPlace 
        ? `${data.eventPlace}${data.eventAddress ? `, ${data.eventAddress}` : ''}`
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
            <p>Hola <strong>${data.guestName}</strong>,</p>
            
            <p>¡Excelente! Tu registro para el evento ha sido confirmado. Estos son los detalles:</p>
            
            <div class="event-details">
              <h3>📅 ${data.eventTitle}</h3>
              <p><strong>📍 Fecha:</strong> ${eventDateTime}</p>
              <p><strong>🏢 Lugar:</strong> ${eventLocation}</p>
              <p><strong>👤 Organizador:</strong> ${data.organizerName}</p>
            </div>

            ${data.qrCode ? `
            <div class="qr-section">
              <h4>🎫 Tu código QR para check-in</h4>
              <p style="font-family: monospace; font-size: 18px; background: #f0f0f0; padding: 10px; border-radius: 4px;">${data.qrCode}</p>
              <p><small>Presenta este código al llegar al evento</small></p>
            </div>
            ` : ''}
            
            <p>
              <a href="${data.eventUrl}" class="btn">Ver galería del evento</a>
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

      await emailitSMTPService.sendEmail({
        to,
        subject: `✅ Confirmación de registro - ${data.eventTitle}`,
        html,
        replyTo: 'noreply@rocky.mx'
      });

      console.log('✅ EMAILIT SMTP: Registration email sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Failed to send registration email:', error);
      console.log('🔄 EMAIL FAILED BUT REGISTRATION CONTINUES');
    }
  }

  async sendCheckInReminder(to: string, data: EventReminderData): Promise<void> {
    try {
      console.log('📧 EMAILIT SMTP: Sending check-in reminder');
      
      const eventDateTime = data.eventDate && data.eventTime 
        ? `${new Date(data.eventDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las ${data.eventTime}`
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
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⏰ ¡Es hoy!</h1>
            <p>Tu evento confirmado es hoy</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${data.guestName}</strong>,</p>
            
            <p>Este es un recordatorio amigable de que el evento al que te registraste es <strong>hoy</strong>:</p>
            
            <div class="reminder-info">
              <h3>🎉 ${data.eventTitle}</h3>
              <p><strong>📅 Cuándo:</strong> ${eventDateTime}</p>
              ${data.eventPlace ? `<p><strong>📍 Dónde:</strong> ${data.eventPlace}</p>` : ''}
            </div>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p>Organizado por ${data.organizerName}</p>
            <p><small>Rocky Events Platform - rocky.mx</small></p>
          </div>
        </body>
        </html>
      `;

      await emailitSMTPService.sendEmail({
        to,
        subject: `⏰ Recordatorio: ${data.eventTitle} es hoy`,
        html
      });

      console.log('✅ EMAILIT SMTP: Check-in reminder sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Failed to send reminder email:', error);
      throw new Error(`Failed to send reminder email: ${error}`);
    }
  }


  async sendNewAttendeeNotification(to: string, data: NewAttendeeNotificationData): Promise<void> {
    try {
      console.log('📧 EMAILIT SMTP: Sending attendee notification');
      
      const companionsText = data.companionsCount && parseInt(data.companionsCount) > 0 
        ? `<p><strong>👥 Acompañantes:</strong> ${data.companionsCount}</p>`
        : '<p><strong>👥 Acompañantes:</strong> Ninguno</p>';
      
      const whatsappText = data.guestWhatsapp 
        ? `<p><strong>📱 WhatsApp:</strong> ${data.guestWhatsapp}</p>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
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
            
            <p>Se ha registrado un nuevo asistente para tu evento <strong>${data.eventTitle}</strong>:</p>
            
            <div class="attendee-info">
              <h3>📋 Información del Asistente</h3>
              <p><strong>👤 Nombre:</strong> ${data.guestName}</p>
              <p><strong>📧 Email:</strong> ${data.guestEmail}</p>
              ${whatsappText}
              ${companionsText}
              <p><strong>🎫 Código QR:</strong> ${data.qrCode}</p>
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
              <a href="${data.eventUrl}/configuracion" class="btn">Ver Todos los Asistentes</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Rocky Events Platform - rocky.mx</p>
          </div>
        </body>
        </html>
      `;

      await emailitSMTPService.sendEmail({
        to,
        subject: `👥 Nuevo asistente registrado - ${data.eventTitle}`,
        html
      });

      console.log('✅ EMAILIT SMTP: Attendee notification sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Failed to send attendee notification:', error);
      throw new Error(`Failed to send attendee notification: ${error}`);
    }
  }

  async sendMultipleAttendeesNotification(to: string, data: MultipleAttendeesNotificationData): Promise<void> {
    try {
      console.log('📧 EMAILIT SMTP: Sending multiple attendees notification');
      
      // Generate list of attendees HTML
      const attendeesListHTML = data.newAttendees.map(attendee => {
        const whatsappText = attendee.guestWhatsapp 
          ? `<p><small>📱 ${attendee.guestWhatsapp}</small></p>`
          : '';
        const companionsText = attendee.companionsCount && parseInt(attendee.companionsCount) > 0 
          ? ` (+${attendee.companionsCount} acompañantes)`
          : '';
        
        return `
          <div class="attendee-item">
            <h4>👤 ${attendee.guestName}${companionsText}</h4>
            <p><small>📧 ${attendee.guestEmail}</small></p>
            ${whatsappText}
            <p><small>⏰ Confirmado: ${new Date(attendee.confirmedAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}</small></p>
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nuevas Confirmaciones de Asistencia</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; text-align: center; }
            .attendees-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .attendee-item { border-bottom: 1px solid #eee; padding: 15px 0; }
            .attendee-item:last-child { border-bottom: none; }
            .attendee-item h4 { margin: 0 0 8px 0; color: #28a745; }
            .attendee-item p { margin: 4px 0; }
            .btn { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 ¡${data.threshold} Nuevas Confirmaciones!</h1>
            <p>Se ha alcanzado el umbral de confirmaciones para tu evento</p>
          </div>
          
          <div class="content">
            <p>Hola Administrador,</p>
            
            <div class="summary">
              <h2>${data.eventTitle}</h2>
              <p><strong>📊 Total confirmados:</strong> ${data.totalConfirmed} personas</p>
              <p><strong>✨ Nuevas confirmaciones:</strong> ${data.newAttendees.length}</p>
            </div>
            
            <div class="attendees-list">
              <h3>👥 Asistentes Recientes</h3>
              ${attendeesListHTML}
            </div>
            
            <p style="text-align: center;">
              <a href="${data.eventUrl}/configuracion" class="btn">Ver Todos los Asistentes</a>
            </p>
            
            <p>¡Tu evento está tomando impulso! 🚀</p>
          </div>
          
          <div class="footer">
            <p>Organizado por ${data.organizerName}</p>
            <p><small>Rocky Events Platform - rocky.mx</small></p>
          </div>
        </body>
        </html>
      `;

      await emailitSMTPService.sendEmail({
        to,
        subject: `🎉 ${data.threshold} nuevas confirmaciones - ${data.eventTitle}`,
        html
      });

      console.log('✅ EMAILIT SMTP: Multiple attendees notification sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Failed to send multiple attendees notification:', error);
      throw new Error(`Failed to send multiple attendees notification: ${error}`);
    }
  }
}

// Emailit REST API Service Implementation
export class EmailitServiceAdapter implements EmailService {
  async sendEventRegistrationConfirmation(to: string, data: EventRegistrationData): Promise<void> {
    try {
      console.log('📧 EMAILIT: Sending registration email');
      
      await emailitService.sendEventRegistrationConfirmation(to, {
        guestName: data.guestName,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventPlace: data.eventPlace,
        eventAddress: data.eventAddress,
        organizerName: data.organizerName,
        eventUrl: data.eventUrl,
        qrCode: data.qrCode
      });

      console.log('✅ EMAILIT: Registration email sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT: Failed to send registration email:', error);
      // Don't throw error - log it but continue registration process
      console.log('🔄 EMAIL FAILED BUT REGISTRATION CONTINUES');
    }
  }

  async sendCheckInReminder(to: string, data: EventReminderData): Promise<void> {
    try {
      console.log('📧 EMAILIT: Sending check-in reminder');
      
      await emailitService.sendCheckInReminder(to, {
        guestName: data.guestName,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventPlace: data.eventPlace,
        organizerName: data.organizerName,
        qrCode: data.guestName // Use guest name as fallback QR
      });

      console.log('✅ EMAILIT: Check-in reminder sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT: Failed to send reminder email:', error);
      throw new Error(`Failed to send reminder email: ${error}`);
    }
  }


  async sendNewAttendeeNotification(to: string, data: NewAttendeeNotificationData): Promise<void> {
    try {
      console.log('📧 EMAILIT: Sending new attendee notification');
      
      await emailitService.sendNewAttendeeNotification(to, {
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestWhatsapp: data.guestWhatsapp,
        companionsCount: data.companionsCount,
        eventTitle: data.eventTitle,
        eventUrl: data.eventUrl,
        qrCode: data.qrCode
      });

      console.log('✅ EMAILIT: New attendee notification sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT: Failed to send new attendee notification:', error);
      // Don't throw error - log it but continue registration process
      console.log('🔄 EMAIL FAILED BUT REGISTRATION CONTINUES');
    }
  }

  async sendMultipleAttendeesNotification(to: string, data: MultipleAttendeesNotificationData): Promise<void> {
    try {
      console.log('📧 EMAILIT: Sending multiple attendees notification');
      
      // For now, use the SMTP implementation via delegation
      // This could be extended to use REST API specific templates in the future
      const smtpService = new EmailitSMTPServiceAdapter();
      await smtpService.sendMultipleAttendeesNotification(to, data);

      console.log('✅ EMAILIT: Multiple attendees notification sent successfully');
    } catch (error) {
      console.error('❌ EMAILIT: Failed to send multiple attendees notification:', error);
      // Don't throw error - log it but continue registration process
      console.log('🔄 EMAIL FAILED BUT REGISTRATION CONTINUES');
    }
  }
}

// Enhanced Email Service with Failover Support
export class EmailitHybridService implements EmailService {
  async sendEventRegistrationConfirmation(to: string, data: EventRegistrationData): Promise<void> {
    try {
      if (USE_EMAILIT_API) {
        // PRIMARY: Try REST API first
        console.log('📧 HYBRID: Attempting REST API (primary)');
        const apiService = new EmailitServiceAdapter();
        await apiService.sendEventRegistrationConfirmation(to, data);
        console.log('✅ HYBRID: REST API success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: REST API failed, trying SMTP fallback');
      console.error('REST API Error:', error);
    }

    try {
      if (USE_EMAILIT_SMTP) {
        // SECONDARY: Try SMTP fallback
        console.log('📧 HYBRID: Attempting SMTP (secondary)');
        const smtpService = new EmailitSMTPServiceAdapter();
        await smtpService.sendEventRegistrationConfirmation(to, data);
        console.log('✅ HYBRID: SMTP success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: SMTP failed, no more fallbacks available');
      console.error('SMTP Error:', error);
    }

    // FINAL: All Emailit services failed
    console.log('❌ HYBRID: Both Emailit services failed, no email sent');
    throw new Error('All email services (REST API and SMTP) failed for registration confirmation');
  }

  async sendCheckInReminder(to: string, data: EventReminderData): Promise<void> {
    try {
      if (USE_EMAILIT_API) {
        console.log('📧 HYBRID: Attempting REST API (primary)');
        const apiService = new EmailitServiceAdapter();
        await apiService.sendCheckInReminder(to, data);
        console.log('✅ HYBRID: REST API success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: REST API failed, trying SMTP fallback');
    }

    try {
      if (USE_EMAILIT_SMTP) {
        console.log('📧 HYBRID: Attempting SMTP (secondary)');
        const smtpService = new EmailitSMTPServiceAdapter();
        await smtpService.sendCheckInReminder(to, data);
        console.log('✅ HYBRID: SMTP success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: SMTP failed, no more fallbacks available');
    }

    // FINAL: All Emailit services failed
    console.log('❌ HYBRID: Both Emailit services failed, no reminder sent');
    throw new Error('All email services (REST API and SMTP) failed for check-in reminder');
  }


  async sendNewAttendeeNotification(to: string, data: NewAttendeeNotificationData): Promise<void> {
    try {
      if (USE_EMAILIT_API) {
        console.log('📧 HYBRID: Attempting REST API (primary)');
        const apiService = new EmailitServiceAdapter();
        await apiService.sendNewAttendeeNotification(to, data);
        console.log('✅ HYBRID: REST API success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: REST API failed, trying SMTP fallback');
    }

    try {
      if (USE_EMAILIT_SMTP) {
        console.log('📧 HYBRID: Attempting SMTP (secondary)');
        const smtpService = new EmailitSMTPServiceAdapter();
        await smtpService.sendNewAttendeeNotification(to, data);
        console.log('✅ HYBRID: SMTP success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: SMTP failed, no more fallbacks available');
    }

    // FINAL: All Emailit services failed
    console.log('❌ HYBRID: Both Emailit services failed, no attendee notification sent');
    throw new Error('All email services (REST API and SMTP) failed for attendee notification');
  }

  async sendMultipleAttendeesNotification(to: string, data: MultipleAttendeesNotificationData): Promise<void> {
    try {
      if (USE_EMAILIT_API) {
        console.log('📧 HYBRID: Attempting REST API (primary)');
        const apiService = new EmailitServiceAdapter();
        await apiService.sendMultipleAttendeesNotification(to, data);
        console.log('✅ HYBRID: REST API success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: REST API failed, trying SMTP fallback');
    }

    try {
      if (USE_EMAILIT_SMTP) {
        console.log('📧 HYBRID: Attempting SMTP (secondary)');
        const smtpService = new EmailitSMTPServiceAdapter();
        await smtpService.sendMultipleAttendeesNotification(to, data);
        console.log('✅ HYBRID: SMTP success');
        return;
      }
    } catch (error) {
      console.log('⚠️ HYBRID: SMTP failed, no more fallbacks available');
    }

    // FINAL: All Emailit services failed
    console.log('❌ HYBRID: Both Emailit services failed, no multiple attendees notification sent');
    throw new Error('All email services (REST API and SMTP) failed for multiple attendees notification');
  }
}

// Export appropriate service based on configuration
export const emailService = USE_EMAILIT 
  ? new EmailitHybridService()
  : (() => { throw new Error('No email service configured. Please configure Emailit.'); })();

// Log which service is being used
if (USE_EMAILIT) {
  if (USE_EMAILIT_API) {
    console.log('📧 EMAIL SERVICE: Using Emailit.com Hybrid (REST API primary, SMTP secondary) for rocky.mx');
  } else if (USE_EMAILIT_SMTP) {
    console.log('📧 EMAIL SERVICE: Using Emailit.com SMTP only for rocky.mx domain');
  } else {
    console.log('📧 EMAIL SERVICE: Using Emailit.com REST API only for rocky.mx domain');
  }
} else {
  console.log('❌ EMAIL SERVICE: No email service configured - Emailit required');
}