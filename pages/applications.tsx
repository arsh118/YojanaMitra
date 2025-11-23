// pages/applications.tsx
// View all user applications
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface Application {
  id: string
  userId: string
  userName: string
  schemeId: string
  schemeTitle: string
  profile: any
  documents: Record<string, string>
  confidence: number
  status: 'pending' | 'approved' | 'rejected' | 'needs_review'
  aiNotes?: string
  parsedFields?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export default function Applications() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_review'>('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  useEffect(() => {
    loadApplications()
  }, [filter])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/applications' 
        : `/api/applications?status=${filter}`
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load applications')
      
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#e8f5e9', color: '#2e7d32', label: 'Approved' }
      case 'rejected':
        return { bg: '#ffebee', color: '#c62828', label: 'Rejected' }
      case 'needs_review':
        return { bg: '#fff3e0', color: '#f57c00', label: 'Needs Review' }
      default:
        return { bg: '#e3f2fd', color: '#1976d2', label: 'Pending' }
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return { bg: '#e8f5e9', color: '#2e7d32' }
    if (confidence >= 0.6) return { bg: '#fff3e0', color: '#f57c00' }
    return { bg: '#ffebee', color: '#c62828' }
  }

  const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
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
          <p style={{ color: colors.gray[600] }}>Loading applications...</p>
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
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: colors.gray[900],
              margin: '0 0 8px 0'
            }}>
              My Applications
            </h1>
            <p style={{
              fontSize: '16px',
              color: colors.gray[600],
              margin: 0
            }}>
              Track all your submitted applications
            </p>
          </div>
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
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {(['all', 'pending', 'approved', 'rejected', 'needs_review'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                background: filter === status 
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.gray[100],
                color: filter === status ? 'white' : colors.gray[700],
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: colors.gray[900],
              margin: '0 0 8px 0'
            }}>
              No Applications Found
            </h2>
            <p style={{
              fontSize: '16px',
              color: colors.gray[600],
              margin: '0 0 24px 0'
            }}>
              {filter === 'all' 
                ? "You haven't submitted any applications yet."
                : `No ${filter.replace('_', ' ')} applications found.`}
            </p>
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
              Start New Application
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {applications.map((app) => {
              const statusStyle = getStatusColor(app.status)
              const confidenceStyle = getConfidenceColor(app.confidence)
              
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedApp?.id === app.id ? `2px solid ${colors.primary}` : '2px solid transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: colors.gray[900],
                        margin: '0 0 8px 0'
                      }}>
                        {app.schemeTitle}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray[600],
                        margin: '0 0 4px 0'
                      }}>
                        Application ID: <span style={{ fontFamily: 'monospace' }}>{app.id}</span>
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        Submitted: {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: confidenceStyle.bg,
                        color: confidenceStyle.color,
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {(app.confidence * 100).toFixed(0)}% Match
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedApp?.id === app.id && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: `1px solid ${colors.gray[200]}`
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.gray[700],
                            margin: '0 0 8px 0'
                          }}>
                            Applicant Details
                          </h4>
                          <div style={{ fontSize: '14px', color: colors.gray[600] }}>
                            <p style={{ margin: '4px 0' }}><strong>Name:</strong> {app.userName}</p>
                            {app.profile?.phone && (
                              <p style={{ margin: '4px 0' }}><strong>Phone:</strong> {app.profile.phone}</p>
                            )}
                            {app.profile?.state && (
                              <p style={{ margin: '4px 0' }}><strong>State:</strong> {app.profile.state}</p>
                            )}
                            {app.profile?.age && (
                              <p style={{ margin: '4px 0' }}><strong>Age:</strong> {app.profile.age}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.gray[700],
                            margin: '0 0 8px 0'
                          }}>
                            Documents
                          </h4>
                          <div style={{ fontSize: '14px', color: colors.gray[600] }}>
                            {Object.keys(app.documents || {}).length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {Object.keys(app.documents).map((doc) => (
                                  <li key={doc} style={{ margin: '4px 0' }}>
                                    {doc.replace(/_/g, ' ').toUpperCase()}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ margin: '4px 0' }}>No documents uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                      {app.aiNotes && (
                        <div style={{
                          background: colors.gray[50],
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '16px'
                        }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.gray[700],
                            margin: '0 0 8px 0'
                          }}>
                            AI Notes
                          </h4>
                          <p style={{
                            fontSize: '14px',
                            color: colors.gray[600],
                            margin: 0,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {app.aiNotes}
                          </p>
                        </div>
                      )}
                      <div style={{
                        marginTop: '16px',
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/application-success?id=${app.id}`)
                          }}
                          style={{
                            padding: '8px 16px',
                            background: colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


