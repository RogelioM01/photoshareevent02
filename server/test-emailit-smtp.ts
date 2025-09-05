#!/usr/bin/env node

/**
 * EMAILIT SMTP TEST
 * 
 * Prueba el servicio SMTP de Emailit usando la credencial em_smtp_
 */

import { config } from 'dotenv';
config();

import { emailitSMTPService } from './emailit-smtp-service';

async function testEmailitSMTP() {
  console.log('📧 PROBANDO EMAILIT SMTP SERVICE');
  console.log('=================================');
  
  try {
    // Test connection first
    console.log('🔗 Testing SMTP connection...');
    const connectionOk = await emailitSMTPService.testConnection();
    
    if (!connectionOk) {
      console.log('❌ SMTP connection failed');
      return;
    }
    
    // Send test email
    console.log('\n📧 Sending test email via SMTP...');
    
    const result = await emailitSMTPService.sendEmail({
      to: '2dcommx01@gmail.com',
      subject: '🚀 Prueba SMTP - Rocky.mx + Emailit.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1>🎉 SMTP Funcionando!</h1>
            <p>Emailit.com SMTP + Rocky.mx</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2>✅ Conexión SMTP Exitosa</h2>
            <p>Hola,</p>
            <p>Este email confirma que la integración <strong>SMTP</strong> entre Rocky Events Platform y Emailit.com está funcionando perfectamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3>🔧 Detalles Técnicos:</h3>
              <ul>
                <li><strong>Método:</strong> SMTP (nodemailer)</li>
                <li><strong>Host:</strong> smtp.emailit.com</li>
                <li><strong>Puerto:</strong> 587</li>
                <li><strong>Dominio:</strong> rocky.mx</li>
                <li><strong>Credencial:</strong> em_smtp_... (SMTP type)</li>
                <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</li>
              </ul>
            </div>
            
            <p>🎯 <strong>Resultado:</strong> El sistema puede enviar emails inmediatamente usando SMTP.</p>
            
            <p>¡Integración SMTP completada exitosamente!</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Rocky Events Platform</p>
            <p><small>Enviado vía SMTP - Emailit.com + rocky.mx</small></p>
          </div>
        </div>
      `,
      text: `
SMTP Funcionando!

Este email confirma que la integración SMTP entre Rocky Events Platform y Emailit.com está funcionando.

Detalles Técnicos:
- Método: SMTP (nodemailer)
- Host: smtp.emailit.com
- Puerto: 587
- Dominio: rocky.mx
- Credencial: em_smtp_... (SMTP type)
- Fecha: ${new Date().toLocaleString('es-ES')}

Resultado: El sistema puede enviar emails inmediatamente usando SMTP.

---
Rocky Events Platform
Enviado vía SMTP - Emailit.com + rocky.mx
      `
    });
    
    console.log('\n🎉 EMAIL SMTP ENVIADO EXITOSAMENTE!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Revisa tu bandeja en: 2dcommx01@gmail.com');
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('✅ Emailit SMTP funcionando perfectamente');
    console.log('✅ Credencial em_smtp_ válida y operacional');
    console.log('✅ Dominio rocky.mx configurado para SMTP');
    console.log('✅ Sistema listo para envío inmediato');
    
  } catch (error) {
    console.error('\n❌ ERROR EN SMTP TEST:', error);
    
    if (error.message?.includes('authentication')) {
      console.log('\n🔧 Error de autenticación SMTP');
      console.log('   Verifica que la credencial em_smtp_ sea válida');
    } else if (error.message?.includes('connection')) {
      console.log('\n🔧 Error de conexión SMTP');
      console.log('   Verifica conectividad a smtp.emailit.com:587');
    } else {
      console.log('\n🔧 Error inesperado - revisa configuración SMTP');
    }
  }
}

testEmailitSMTP();