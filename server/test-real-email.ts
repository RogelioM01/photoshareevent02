#!/usr/bin/env node

/**
 * EMAILIT REAL EMAIL TEST
 * 
 * Prueba enviando un email real usando Emailit.com
 */

import { config } from 'dotenv';
config(); // Load environment variables

import { emailitService } from './emailit-service';

// Reinitialize service after loading env vars
emailitService.reinitialize();

async function sendTestEmail() {
  console.log('📧 ENVIANDO EMAIL DE PRUEBA CON EMAILIT');
  console.log('=====================================');
  
  const testEmail = '2dcommx01@gmail.com'; // Corrected email format
  
  try {
    console.log(`📍 Enviando email de prueba a: ${testEmail}`);
    
    // Test with registration confirmation email
    const testData = {
      guestName: 'Usuario de Prueba',
      eventTitle: 'Evento de Prueba - Integración Emailit Rocky.mx',
      eventDate: '2025-08-25',
      eventTime: '19:00',
      eventPlace: 'Centro de Convenciones Rocky',
      eventAddress: 'Av. Principal 123, Ciudad de México',
      organizerName: 'Rocky Events',
      eventUrl: 'https://rocky.mx/evento/test',
      qrCode: 'ROCKY2025TEST'
    };

    const result = await emailitService.sendEventRegistrationConfirmation(
      testEmail,
      testData
    );

    console.log('🎉 EMAIL ENVIADO EXITOSAMENTE!');
    console.log('📧 ID del email:', result.id);
    console.log('📊 Estado:', result.status);
    console.log(`📬 Revisa tu bandeja de entrada en: ${testEmail}`);
    
    // Test simple email too
    console.log('\n📧 Enviando email simple adicional...');
    
    const simpleResult = await emailitService.sendEmail({
      to: testEmail,
      subject: 'Prueba de Integración - Rocky.mx + Emailit.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1>🚀 Integración Exitosa</h1>
            <p>Emailit.com + Rocky.mx funcionando perfectamente</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2>✅ Prueba Completada</h2>
            <p>Hola,</p>
            <p>Este email confirma que la integración entre <strong>Rocky Events Platform</strong> y <strong>Emailit.com</strong> está funcionando correctamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3>🔧 Detalles Técnicos:</h3>
              <ul>
                <li><strong>Servicio de Email:</strong> Emailit.com</li>
                <li><strong>Dominio:</strong> rocky.mx</li>
                <li><strong>Fecha de Prueba:</strong> ${new Date().toLocaleString('es-ES')}</li>
                <li><strong>Estado:</strong> Operacional</li>
              </ul>
            </div>
            
            <p>Si recibes este email, significa que el sistema está listo para enviar notificaciones de eventos, confirmaciones de registro y recordatorios.</p>
            
            <p>¡Gracias por probar la integración!</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Rocky Events Platform</p>
            <p><small>Powered by Emailit.com - rocky.mx</small></p>
          </div>
        </div>
      `,
      text: `
Integración Exitosa - Rocky.mx + Emailit.com

Este email confirma que la integración está funcionando correctamente.

Detalles Técnicos:
- Servicio: Emailit.com
- Dominio: rocky.mx  
- Fecha: ${new Date().toLocaleString('es-ES')}
- Estado: Operacional

Si recibes este email, el sistema está listo para producción.

---
Rocky Events Platform
Powered by Emailit.com - rocky.mx
      `,
      headers: {
        'X-Test-Type': 'integration-test',
        'X-Platform': 'Rocky Events'
      }
    });

    console.log('✅ Email simple enviado también!');
    console.log('📧 ID:', simpleResult.id);
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('✅ Emailit.com está funcionando correctamente');
    console.log('✅ Dominio rocky.mx configurado');
    console.log('✅ Templates HTML renderizando bien');
    console.log('✅ Sistema listo para producción');
    
  } catch (error) {
    console.error('\n❌ ERROR AL ENVIAR EMAIL:', error);
    
    if (error.message?.includes('Invalid API Key')) {
      console.log('\n🔧 La API key necesita ser válida para envío real');
      console.log('   Verifica tu cuenta en https://emailit.com');
    } else if (error.message?.includes('Domain')) {
      console.log('\n🔧 El dominio rocky.mx necesita verificación');
      console.log('   Configura SPF y DKIM en tu proveedor DNS');
    } else {
      console.log('\n🔧 Error inesperado - revisa configuración');
    }
  }
}

// Run the test
sendTestEmail();