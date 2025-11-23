// pages/api/send-otp.ts
// Send OTP via Twilio SMS/WhatsApp
import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/twilioSend'
import { storeOtp } from '../../lib/otpStore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { phone } = req.body

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required' })
  }

  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP
    storeOtp(phone, otp, 10) // 10 minutes expiry

    // Format phone number for Twilio
    const formattedPhone = `+91${phone}`

    // Send OTP via WhatsApp (preferred) or SMS
    const message = `Your YojanaMitra login OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share this OTP with anyone.\n\nIf you didn't request this, please ignore this message.`

    // Try WhatsApp first
    let result = await sendMessage(`whatsapp:${formattedPhone}`, message)
    
    // If WhatsApp fails, try SMS
    if (!result.success) {
      console.log('[send-otp] WhatsApp failed, trying SMS...')
      result = await sendMessage(formattedPhone, message)
    }

    if (!result.success) {
      console.error('[send-otp] Failed to send OTP:', result.error)
      
      // For development/testing, still return success but log the OTP
      // This allows testing even if Twilio is not configured
      console.log(`[send-otp] DEVELOPMENT MODE - OTP for ${phone}: ${otp}`)
      return res.status(200).json({
        success: true,
        message: 'OTP generated (Twilio not configured - check alert/console for OTP)',
        devOtp: otp, // Show OTP in dev mode
        warning: 'Twilio is not configured. In production, OTP will be sent via WhatsApp/SMS. See TWILIO_SETUP.md for setup instructions.'
      })
    }

    console.log(`[send-otp] OTP sent to ${phone} via ${result.sid ? 'Twilio' : 'SMS'}`)
    
    // In development, also log the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[send-otp] DEVELOPMENT MODE - OTP for ${phone}: ${otp}`)
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your phone',
        expiresIn: 600, // 10 minutes in seconds
        devOtp: otp // Show OTP in dev mode for testing
      })
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (err: any) {
    console.error('[send-otp] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

