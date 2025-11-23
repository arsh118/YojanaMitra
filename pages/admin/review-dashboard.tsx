// pages/admin/review-dashboard.tsx
// Human-in-the-loop Dashboard for reviewers
import React, { useState, useEffect } from 'react';

interface Application {
  id: string;
  userId: string;
  userName: string;
  schemeId: string;
  schemeTitle: string;
  profile: any;
  documents: Record<string, string>;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  aiNotes: string;
  parsedFields: Record<string, any>;
  createdAt: string;
}

export default function ReviewDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'low_confidence' | 'needs_review'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?filter=${filter}`);
      if (!res.ok) throw new Error('Failed to load applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      const res = await fetch('/api/review-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, action: 'approve' })
      });
      if (!res.ok) throw new Error('Failed to approve');
      loadApplications();
      setSelectedApp(null);
    } catch (err) {
      alert('Failed to approve application');
    }
  };

  const handleReject = async (appId: string, reason: string) => {
    try {
      const res = await fetch('/api/review-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, action: 'reject', reason })
      });
      if (!res.ok) throw new Error('Failed to reject');
      loadApplications();
      setSelectedApp(null);
    } catch (err) {
      alert('Failed to reject application');
    }
  };

  const filteredApps = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'pending') return app.status === 'pending';
    if (filter === 'low_confidence') return app.confidence < 0.6;
    if (filter === 'needs_review') return app.status === 'needs_review';
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>Review Dashboard</h1>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All Applications' },
            { key: 'pending', label: 'Pending Review' },
            { key: 'low_confidence', label: 'Low Confidence' },
            { key: 'needs_review', label: 'Needs Review' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              style={{
                padding: '10px 20px',
                background: filter === f.key ? '#667eea' : '#e0e0e0',
                color: filter === f.key ? 'white' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: filter === f.key ? 'bold' : 'normal'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Applications Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading applications...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Scheme</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Confidence</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      background: selectedApp?.id === app.id ? '#f0f7ff' : 'white'
                    }}
                  >
                    <td style={{ padding: '12px' }}>{app.userName}</td>
                    <td style={{ padding: '12px' }}>{app.schemeTitle}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: app.confidence >= 0.8 ? '#e8f5e9' : app.confidence >= 0.6 ? '#fff3e0' : '#ffebee',
                        color: app.confidence >= 0.8 ? '#2e7d32' : app.confidence >= 0.6 ? '#f57c00' : '#c62828',
                        fontWeight: 'bold'
                      }}>
                        {(app.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: app.status === 'approved' ? '#e8f5e9' : app.status === 'rejected' ? '#ffebee' : '#fff3e0',
                        color: app.status === 'approved' ? '#2e7d32' : app.status === 'rejected' ? '#c62828' : '#f57c00',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Review Panel */}
        {selectedApp && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px solid #667eea'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Review Application</h2>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h3>User Profile</h3>
                <pre style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(selectedApp.profile, null, 2)}
                </pre>
              </div>

              <div>
                <h3>AI Notes</h3>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  {selectedApp.aiNotes || 'No AI notes available'}
                </div>

                <h3 style={{ marginTop: '20px' }}>Parsed Fields</h3>
                <pre style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(selectedApp.parsedFields, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleApprove(selectedApp.id)}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  if (reason) handleReject(selectedApp.id, reason);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



