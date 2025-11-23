// pages/profile.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    
    // Load profile data if available
    const profileData = localStorage.getItem('profile');
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, [router]);

  const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    secondary: '#f59e0b',
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
  };

  if (!user) {
    return null;
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: colors.gray[900],
              marginBottom: '8px'
            }}>
              👤 My Profile
            </h1>
            <p style={{
              color: colors.gray[600],
              fontSize: '16px'
            }}>
              View and manage your profile information
            </p>
          </div>
          <Link href="/" style={{
            padding: '12px 24px',
            background: colors.gray[200],
            color: colors.gray[700],
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            ← Back
          </Link>
        </div>

        <div style={{
          background: colors.gray[50],
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '40px',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: colors.gray[900],
                marginBottom: '8px'
              }}>
                {user.name || 'User'}
              </h2>
              <p style={{
                fontSize: '16px',
                color: colors.gray[600],
                margin: 0
              }}>
                +91 {user.phone}
              </p>
            </div>
          </div>

          {profile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {profile.age && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.gray[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Age
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900]
                  }}>
                    {profile.age} years
                  </div>
                </div>
              )}
              {profile.state && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.gray[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    State
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900]
                  }}>
                    {profile.state}
                  </div>
                </div>
              )}
              {profile.income_annual && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.gray[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Annual Income
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900]
                  }}>
                    ₹{profile.income_annual.toLocaleString()}
                  </div>
                </div>
              )}
              {profile.caste && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.gray[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Category
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900]
                  }}>
                    {profile.caste}
                  </div>
                </div>
              )}
              {profile.education && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.gray[500],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Education
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.gray[900]
                  }}>
                    {profile.education}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          background: colors.primary + '10',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${colors.primary}30`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: colors.gray[900],
            marginBottom: '12px'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <Link href="/" style={{
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: '600'
            }}>
              🏠 Go to Dashboard
            </Link>
            <Link href="/applications" style={{
              padding: '12px 24px',
              background: 'white',
              color: colors.primary,
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              border: `2px solid ${colors.primary}`
            }}>
              📋 My Applications
            </Link>
            <Link href="/saved-schemes" style={{
              padding: '12px 24px',
              background: 'white',
              color: colors.primary,
              textDecoration: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              border: `2px solid ${colors.primary}`
            }}>
              ⭐ Saved Schemes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


