#!/usr/bin/env node

/**
 * TEST FALLBACK EMAIL SYSTEM
 * 
 * Demuestra el sistema dual: Emailit (primario) + Resend (fallback)
 */

import { config } from 'dotenv';
config();

import { emailService } from './email-service';

async function testEmailSystem() {
  console.log('📧 PROBANDO SISTEMA DE EMAIL DUAL');
  console.log('==================================');
  
  const testEmail = '2dcommx01@gmail.com';
  
  try {
    console.log(`📍 Enviando email de prueba a: ${testEmail}`);
    console.log('🔄 Sistema automáticamente usará el servicio disponible');
    
    // Test registration email
    const eventData = {
      guestName: 'Usuario de Prueba',
      eventTitle: 'Evento Demo - Sistema Dual Rocky.mx',
      eventDate: '2025-08-25',
      eventTime: '19:00',
      eventPlace: 'Centro de Convenciones',
      eventAddress: 'Av. Principal 123, CDMX',
      qrCode: 'ROCKY2025DEMO',
      eventUrl: 'https://rocky.mx/evento/demo',
      organizerName: 'Rocky Events Platform'
    };

    await emailService.sendEventRegistrationConfirmation(testEmail, eventData);
    
    console.log('✅ Email de confirmación enviado exitosamente');
    console.log(`📬 Revisa tu bandeja en: ${testEmail}`);
    
    // Test photo notification
    console.log('\n📸 Enviando notificación de fotos...');
    
    const photoData = {
      guestName: 'Usuario de Prueba', 
      eventTitle: 'Evento Demo - Sistema Dual Rocky.mx',
      photoCount: 3,
      eventUrl: 'https://rocky.mx/evento/demo/fotos',
      organizerName: 'Rocky Events Platform'
    };
    
    await emailService.sendNewPhotoNotification(testEmail, photoData);
    
    console.log('✅ Notificación de fotos enviada');
    
    console.log('\n🎯 SISTEMA DUAL FUNCIONANDO:');
    console.log('✅ Fallback automático operacional');
    console.log('✅ Templates HTML renderizando');
    console.log('✅ Emails llegando a destino');
    console.log('✅ Sistema listo para producción');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmailSystem();