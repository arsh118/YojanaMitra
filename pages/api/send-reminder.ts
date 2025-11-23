// pages/api/send-reminder.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/twilioSend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { to, body, via } = req.body

  if (!to || !body) {
    return res.status(400).json({ 
      error: 'Phone number (to) and message (body) are required',
      received: { to: !!to, body: !!body }
    })
  }

  // Validate phone number format
  const phoneRegex = /^(\+91|whatsapp:\+91|91)?[6-9]\d{9}$/
  const cleanPhone = to.replace(/[^\d+]/g, '')
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ 
      error: 'Invalid phone number format. Please use a valid Indian mobile number (10 digits starting with 6-9).',
      example: 'whatsapp:+91XXXXXXXXXX or +91XXXXXXXXXX'
    })
  }

  try {
    // Ensure proper format for WhatsApp
    let formattedTo = to
    if (via === 'whatsapp' && !to.startsWith('whatsapp:')) {
      formattedTo = `whatsapp:${to.replace(/^\+/, '+')}`
    } else if (!to.startsWith('whatsapp:') && !to.startsWith('+')) {
      formattedTo = `whatsapp:+91${to.replace(/\D/g, '')}`
    }

    console.log('[send-reminder] Sending message to:', formattedTo)
    const r = await sendMessage(formattedTo, body)
    
    if (!r.success) {
      console.error('[send-reminder] Failed:', r.error)
      return res.status(500).json({ 
        error: r.error || 'Failed to send message',
        hint: 'Please check Twilio configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)'
      })
    }
    
    console.log('[send-reminder] Success:', r.sid)
    return res.status(200).json({ 
      ok: true, 
      sid: r.sid,
      message: 'Message sent successfully'
    })
  } catch (err: any) {
    console.error('[send-reminder] Error:', err)
    return res.status(500).json({ 
      error: err.message || 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}
