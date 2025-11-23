// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    secondary: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[login] Non-JSON response:', text.substring(0, 200));
        throw new Error(`API route not found (${res.status}). Please restart the development server (Ctrl+C then npm run dev) to load new API routes.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Show OTP in alert if provided (development mode or Twilio not configured)
      if (data.devOtp) {
        alert(`🔐 OTP Generated\n\nYour OTP is: ${data.devOtp}\n\n${data.warning || 'In production, you would receive this via WhatsApp/SMS.'}\n\nPlease enter this OTP to continue.`);
      }

      setShowOtp(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check Twilio configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[login] Non-JSON response:', text.substring(0, 200));
        throw new Error(`API route not found (${res.status}). Please restart the development server (Ctrl+C then npm run dev) to load new API routes.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Store user session
      const userData = {
        phone,
        name: `User ${phone.slice(-4)}`,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, ${colors.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
          }}>
            🇮🇳
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: colors.gray[900],
            marginBottom: '8px'
          }}>
            Welcome to YojanaMitra
          </h1>
          <p style={{
            color: colors.gray[600],
            fontSize: '16px'
          }}>
            Login to access your personalized scheme dashboard
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: colors.danger,
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: `1px solid ${colors.danger}20`,
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!showOtp ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700]
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${colors.gray[200]}`,
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.gray[200]}
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length !== 10}
              style={{
                width: '100%',
                padding: '16px',
                background: (loading || phone.length !== 10) ? colors.gray[300] : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (loading || phone.length !== 10) ? 'not-allowed' : 'pointer',
                boxShadow: (loading || phone.length !== 10) ? 'none' : `0 4px 12px ${colors.primary}40`,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700]
              }}>
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${colors.gray[200]}`,
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  letterSpacing: '8px'
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.gray[200]}
              />
              <p style={{
                marginTop: '8px',
                fontSize: '12px',
                color: colors.gray[500],
                textAlign: 'center'
              }}>
                OTP sent to +91 {phone}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowOtp(false);
                  setOtp('');
                }}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: colors.gray[100],
                  color: colors.gray[700],
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Change Number
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: (loading || otp.length !== 6) ? colors.gray[300] : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                  boxShadow: (loading || otp.length !== 6) ? 'none' : `0 4px 12px ${colors.primary}40`
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: `1px solid ${colors.gray[200]}`,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: colors.gray[500],
            margin: 0
          }}>
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

