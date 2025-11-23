// lib/otpStore.ts
// Shared OTP store for send-otp and verify-otp endpoints

interface OtpData {
  otp: string;
  expiresAt: number;
}

const otpStore: Record<string, OtpData> = {}

// Clean up expired OTPs every 5 minutes
// Only run in Node.js environment (not in browser)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(otpStore).forEach(phone => {
      if (otpStore[phone] && otpStore[phone].expiresAt < now) {
        delete otpStore[phone]
      }
    })
  }, 5 * 60 * 1000)
}

export function storeOtp(phone: string, otp: string, expiresInMinutes: number = 10) {
  otpStore[phone] = {
    otp,
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000
  }
}

export function getOtp(phone: string): OtpData | null {
  return otpStore[phone] || null
}

export function deleteOtp(phone: string) {
  delete otpStore[phone]
}

export default otpStore


