// pages/settings.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [notifications, setNotifications] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    const settings = localStorage.getItem('settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setDarkMode(parsed.darkMode || false);
      setLanguage(parsed.language || 'EN');
      setNotifications(parsed.notifications !== false);
      setWhatsappAlerts(parsed.whatsappAlerts !== false);
    }
  }, [router]);

  const saveSettings = () => {
    const settings = {
      darkMode,
      language,
      notifications,
      whatsappAlerts
    };
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

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

  // Settings page works without user login

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
              ⚙️ Settings
            </h1>
            <p style={{
              color: colors.gray[600],
              fontSize: '16px'
            }}>
              Manage your account preferences
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

        {/* Profile Section */}
        <div style={{
          background: colors.gray[50],
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.gray[900],
            marginBottom: '16px'
          }}>
            Profile Information
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.gray[900]
              }}>
                {user?.name || 'Guest User'}
              </div>
              {user?.phone && (
                <div style={{
                  fontSize: '14px',
                  color: colors.gray[600]
                }}>
                  +91 {user.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={{
          background: colors.gray[50],
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.gray[900],
            marginBottom: '20px'
          }}>
            Preferences
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.gray[900],
                  marginBottom: '4px'
                }}>
                  Dark Mode
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.gray[600]
                }}>
                  Switch to dark theme
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: '56px',
                  height: '32px',
                  background: darkMode ? colors.primary : colors.gray[300],
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: darkMode ? '26px' : '2px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.gray[900],
                  marginBottom: '4px'
                }}>
                  Language
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.gray[600]
                }}>
                  Choose your preferred language
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${colors.gray[200]}`,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="EN">English</option>
                <option value="HI">हिंदी (Hindi)</option>
                <option value="BN">বাংলা (Bengali)</option>
                <option value="ML">മലയാളം (Malayalam)</option>
                <option value="TA">தமிழ் (Tamil)</option>
                <option value="TE">తెలుగు (Telugu)</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.gray[900],
                  marginBottom: '4px'
                }}>
                  Notifications
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.gray[600]
                }}>
                  Receive app notifications
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                style={{
                  width: '56px',
                  height: '32px',
                  background: notifications ? colors.primary : colors.gray[300],
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: notifications ? '26px' : '2px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.gray[900],
                  marginBottom: '4px'
                }}>
                  WhatsApp Alerts
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.gray[600]
                }}>
                  Get reminders via WhatsApp
                </div>
              </div>
              <button
                onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                style={{
                  width: '56px',
                  height: '32px',
                  background: whatsappAlerts ? colors.primary : colors.gray[300],
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: whatsappAlerts ? '26px' : '2px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={saveSettings}
          style={{
            width: '100%',
            padding: '16px',
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${colors.primary}40`
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}


