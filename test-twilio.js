// Quick test script to verify Twilio configuration
// Run: node test-twilio.js

require('dotenv').config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

console.log('\n🔍 Checking Twilio Configuration...\n');

// Check if credentials exist
if (!accountSid || accountSid === 'your_twilio_account_sid') {
  console.log('❌ TWILIO_ACCOUNT_SID is not set or has placeholder value');
  console.log('   Please update .env.local with your actual Account SID\n');
  process.exit(1);
}

if (!authToken || authToken === 'your_twilio_auth_token') {
  console.log('❌ TWILIO_AUTH_TOKEN is not set or has placeholder value');
  console.log('   Please update .env.local with your actual Auth Token\n');
  process.exit(1);
}

if (!fromNumber) {
  console.log('❌ TWILIO_FROM_NUMBER is not set');
  console.log('   Please set it to: whatsapp:+14155238886\n');
  process.exit(1);
}

// Check format
if (!accountSid.startsWith('AC')) {
  console.log('⚠️  Warning: Account SID should start with "AC"');
}

if (!fromNumber.startsWith('whatsapp:')) {
  console.log('⚠️  Warning: FROM_NUMBER should start with "whatsapp:"');
}

console.log('✅ Configuration looks good!');
console.log(`   Account SID: ${accountSid.substring(0, 10)}...`);
console.log(`   Auth Token: ${authToken.substring(0, 10)}...`);
console.log(`   From Number: ${fromNumber}\n`);

// Try to create Twilio client
try {
  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);
  console.log('✅ Twilio client created successfully!\n');
  console.log('🎉 Twilio is configured correctly!');
  console.log('   You can now use WhatsApp features in the app.\n');
} catch (err) {
  console.log('❌ Error creating Twilio client:');
  console.log(`   ${err.message}\n`);
  console.log('   Make sure twilio package is installed:');
  console.log('   npm install twilio\n');
  process.exit(1);
}

