// pages/api/verify-otp.ts
// Verify OTP
import { NextApiRequest, NextApiResponse } from 'next'
import { getOtp, deleteOtp } from '../../lib/otpStore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { phone, otp } = req.body

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required' })
  }

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: 'Valid 6-digit OTP is required' })
  }

  try {
    const stored = getOtp(phone)

    if (!stored) {
      return res.status(400).json({ error: 'OTP not found. Please request a new OTP.' })
    }

    if (Date.now() > stored.expiresAt) {
      deleteOtp(phone)
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' })
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' })
    }

    // OTP verified successfully - remove it
    deleteOtp(phone)

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (err: any) {
    console.error('[verify-otp] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to verify OTP',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

