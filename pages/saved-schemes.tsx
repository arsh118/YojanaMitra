// pages/saved-schemes.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SavedSchemes() {
  const router = useRouter();
  const [savedSchemes, setSavedSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('savedSchemes');
    if (saved) {
      const schemeIds = JSON.parse(saved);
      // Load scheme details
      fetch('/data/schemes.json')
        .then(res => res.json())
        .then(allSchemes => {
          const saved = allSchemes.filter((s: any) => schemeIds.includes(s.id));
          setSavedSchemes(saved);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load schemes:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleRemove = (schemeId: string) => {
    const saved = JSON.parse(localStorage.getItem('savedSchemes') || '[]');
    const updated = saved.filter((id: string) => id !== schemeId);
    localStorage.setItem('savedSchemes', JSON.stringify(updated));
    setSavedSchemes(savedSchemes.filter(s => s.id !== schemeId));
  };

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
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
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
              ⭐ Saved Schemes
            </h1>
            <p style={{
              color: colors.gray[600],
              fontSize: '16px'
            }}>
              Your bookmarked government schemes
            </p>
          </div>
          <Link href="/" style={{
            padding: '12px 24px',
            background: colors.primary,
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            ← Back to Home
          </Link>
        </div>

        {savedSchemes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⭐</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: colors.gray[900],
              marginBottom: '8px'
            }}>
              No Saved Schemes
            </h2>
            <p style={{
              color: colors.gray[600],
              marginBottom: '24px'
            }}>
              Start exploring and save schemes you're interested in
            </p>
            <Link href="/" style={{
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              Explore Schemes
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {savedSchemes.map((scheme) => (
              <div
                key={scheme.id}
                style={{
                  background: colors.gray[50],
                  borderRadius: '16px',
                  padding: '24px',
                  border: `2px solid ${colors.gray[200]}`,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.gray[200];
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <button
                  onClick={() => handleRemove(scheme.id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  ❌
                </button>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: colors.gray[900],
                  marginBottom: '8px',
                  paddingRight: '40px'
                }}>
                  {scheme.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: colors.gray[600],
                  marginBottom: '16px'
                }}>
                  {scheme.description}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    background: colors.primary + '20',
                    color: colors.primary,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {scheme.state}
                  </span>
                </div>
                <Link
                  href={`/application-wizard?schemeId=${scheme.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: colors.primary,
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Apply Now →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


