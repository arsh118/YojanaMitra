// pages/application-success.tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function ApplicationSuccess() {
  const router = useRouter()
  const { id } = router.query
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      // Load application details
      fetch(`/api/applications?id=${id}`)
        .then(res => res.json())
        .then(data => {
          setApplication(data.application)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load application:', err)
          setLoading(false)
        })
    }
  }, [id])

  const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    success: '#10b981',
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
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: colors.gray[600] }}>Loading application details...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Success Icon */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '48px',
            boxShadow: `0 8px 24px ${colors.success}40`
          }}>
            ✓
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.gray[900],
            margin: '0 0 8px 0'
          }}>
            Application Submitted Successfully!
          </h1>
          <p style={{
            fontSize: '18px',
            color: colors.gray[600],
            margin: 0
          }}>
            Your application has been received and is being processed
          </p>
        </div>

        {/* Application Details */}
        {application && (
          <div style={{
            background: colors.gray[50],
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: colors.gray[900],
              margin: '0 0 16px 0'
            }}>
              Application Details
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.gray[600], fontWeight: '500' }}>Application ID:</span>
                <span style={{ color: colors.gray[900], fontFamily: 'monospace' }}>{application.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.gray[600], fontWeight: '500' }}>Scheme:</span>
                <span style={{ color: colors.gray[900] }}>{application.schemeTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.gray[600], fontWeight: '500' }}>Status:</span>
                <span style={{
                  color: application.status === 'pending' ? colors.success : colors.primary,
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {application.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.gray[600], fontWeight: '500' }}>Submitted:</span>
                <span style={{ color: colors.gray[900] }}>
                  {new Date(application.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div style={{
          background: colors.primary + '10',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: `1px solid ${colors.primary}30`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.gray[900],
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Next Steps
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: '12px'
          }}>
            {application?.nextSteps?.map((step: string, index: number) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                color: colors.gray[700]
              }}>
                <span style={{ color: colors.primary, fontSize: '20px' }}>•</span>
                <span>{step}</span>
              </li>
            )) || [
              'Your application is under review',
              'You will receive updates via WhatsApp',
              'Check your application status in the dashboard'
            ].map((step, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                color: colors.gray[700]
              }}>
                <span style={{ color: colors.primary, fontSize: '20px' }}>•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: `0 4px 12px ${colors.primary}40`
            }}
          >
            🏠 Back to Home
          </button>
          <button
            onClick={() => router.push(`/applications`)}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: colors.primary,
              border: `2px solid ${colors.primary}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            📊 View All Applications
          </button>
        </div>
      </div>
    </div>
  )
}


