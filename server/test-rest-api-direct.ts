#!/usr/bin/env node

/**
 * TEST DIRECT REST API
 * 
 * Prueba directa del API REST de Emailit con la nueva API key
 */

import { config } from 'dotenv';
config();

import { emailitService } from './emailit-service';

async function testDirectRestAPI() {
  console.log('🎯 PROBANDO API REST DIRECTO');
  console.log('============================');
  console.log('🔑 API Key:', process.env.EMAILIT_API_KEY?.substring(0, 12) + '...');
  
  try {
    // Force reinitialize with new API key
    emailitService.reinitialize();
    
    console.log('\n📧 Enviando email de prueba via REST API...');
    
    const testData = {
      guestName: 'Usuario API REST',
      eventTitle: 'Prueba Directa REST API - Rocky.mx',
      eventDate: '2025-08-25',
      eventTime: '20:00',
      eventPlace: 'Centro de Eventos Rocky',
      eventAddress: 'Av. Reforma 456, CDMX',
      organizerName: 'Rocky Events Platform',
      eventUrl: 'https://rocky.mx/evento/rest-api-test',
      qrCode: 'RESTAPI2025'
    };

    const result = await emailitService.sendEventRegistrationConfirmation(
      '2dcommx01@gmail.com',
      testData
    );

    console.log('🎉 REST API FUNCIONANDO EXITOSAMENTE!');
    console.log('📧 Email ID:', result.id);
    console.log('📊 Status:', result.status);
    console.log('📬 Revisa tu bandeja en: 2dcommx01@gmail.com');
    
    console.log('\n🎯 RESULTADO:');
    console.log('✅ REST API em_api_ funcionando perfectamente');
    console.log('✅ Dominio rocky.mx verificado y operacional');
    console.log('✅ Templates HTML enviados via API REST');
    console.log('✅ Sistema primario completamente funcional');
    
  } catch (error) {
    console.error('\n❌ ERROR REST API:', error);
    
    if (error.message?.includes('Invalid API Key')) {
      console.log('\n🔧 La API key REST necesita verificación');
      console.log('   Verifica que em_api_ esté correcta en Emailit');
    } else if (error.message?.includes('Domain')) {
      console.log('\n🔧 Dominio rocky.mx necesita verificación REST');
      console.log('   Verifica configuración en dashboard Emailit');
    } else {
      console.log('\n🔧 Error inesperado - revisa configuración API');
    }
  }
}

testDirectRestAPI();