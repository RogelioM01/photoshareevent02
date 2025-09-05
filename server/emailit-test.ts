#!/usr/bin/env node

/**
 * EMAILIT SERVICE TEST SCRIPT
 * 
 * Tests Emailit.com integration for rocky.mx domain
 * Run with: npm run test:emailit or node server/emailit-test.ts
 */

import { config } from 'dotenv';
config(); // Load environment variables

import { emailitService } from './emailit-service';

// Reinitialize service after loading env vars
emailitService.reinitialize();

async function testEmailitService() {
  console.log('🧪 TESTING EMAILIT SERVICE');
  console.log('============================');
  
  try {
    // Test 1: Registration Confirmation Email
    console.log('\n📧 Test 1: Registration Confirmation Email');
    
    const testRegistrationData = {
      guestName: 'Test User',
      eventTitle: 'Test Event - Emailit Integration',
      eventDate: '2025-08-25',
      eventTime: '19:00',
      eventPlace: 'Centro de Convenciones',
      eventAddress: 'Av. Principal 123, Ciudad',
      organizerName: 'Rocky Events',
      eventUrl: 'https://rocky.mx/evento/test',
      qrCode: 'TEST1234'
    };

    await emailitService.sendEventRegistrationConfirmation(
      'test@rocky.mx',
      testRegistrationData
    );

    console.log('✅ Registration email test completed');

    // Test 2: Photo Notification Email
    console.log('\n📸 Test 2: Photo Notification Email');
    
    const testPhotoData = {
      eventTitle: 'Test Event - Emailit Integration',
      uploaderName: 'Test Photographer',
      photoCount: 5,
      eventUrl: 'https://rocky.mx/evento/test/album',
      organizerName: 'Rocky Events'
    };

    await emailitService.sendNewPhotoNotification(
      'test@rocky.mx',
      testPhotoData
    );

    console.log('✅ Photo notification test completed');

    // Test 3: Check-in Reminder Email
    console.log('\n⏰ Test 3: Check-in Reminder Email');
    
    const testReminderData = {
      guestName: 'Test User',
      eventTitle: 'Test Event - Emailit Integration',
      eventDate: '2025-08-25',
      eventTime: '19:00',
      eventPlace: 'Centro de Convenciones',
      organizerName: 'Rocky Events',
      qrCode: 'TEST1234'
    };

    await emailitService.sendCheckInReminder(
      'test@rocky.mx',
      testReminderData
    );

    console.log('✅ Check-in reminder test completed');

    console.log('\n🎉 ALL EMAILIT TESTS PASSED!');
    console.log('✅ Emailit service is ready for production use');
    
  } catch (error) {
    console.error('\n❌ EMAILIT TEST FAILED:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify EMAILIT_API_KEY is set correctly');
    console.log('2. Check that rocky.mx domain is verified in Emailit dashboard');
    console.log('3. Ensure SPF and DKIM records are configured');
    console.log('4. Verify API quota limits in Emailit account');
    process.exit(1);
  }
}

// Run tests if called directly
testEmailitService();