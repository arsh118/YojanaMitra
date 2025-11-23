import twilio from 'twilio'

// debug: prints at server start to confirm envs loaded
console.log("TWILIO DEBUG:", {
  sid: process.env.TWILIO_ACCOUNT_SID,
  from: process.env.TWILIO_FROM_NUMBER
});

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER // e.g. 'whatsapp:+14155238886'

if (!accountSid || !authToken || !fromNumber) {
  console.warn('❌ Twilio env vars missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER')
}

const client = twilio(accountSid || '', authToken || '')

/**
 * Send SMS or WhatsApp message (server-side only).
 * - to: '+91XXXXXXXXXX' for SMS OR 'whatsapp:+91XXXXXXXXXX' for WhatsApp
 * - body: text content
 */
export async function sendMessage(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio not configured (check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)' }
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to
    })
    return { success: true, sid: message.sid }
  } catch (err: any) {
    console.error('Twilio sendMessage error:', err)
    const errorMsg = err?.message || JSON.stringify(err)
    return { success: false, error: errorMsg }
  }
}

