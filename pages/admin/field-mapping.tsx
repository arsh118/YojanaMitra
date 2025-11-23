// pages/admin/field-mapping.tsx
// Form Auto-Fill + Field Mapping Editor (Admin UI)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ParsedField {
  name: string;
  type: string;
  value?: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ProfileField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
}

interface FieldMapping {
  pdfField: string;
  profileField: string;
  transformation?: string; // e.g., "uppercase", "date_format", "phone_format"
}

export default function FieldMappingEditor() {
  const router = useRouter();
  const { pdfUrl, schemeId } = router.query;

  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedPdfField, setSelectedPdfField] = useState<string | null>(null);

  const profileFields: ProfileField[] = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'state', label: 'State', type: 'select' },
    { key: 'income_annual', label: 'Annual Income', type: 'number' },
    { key: 'caste', label: 'Category/Caste', type: 'select' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'pincode', label: 'Pincode', type: 'text' },
    { key: 'aadhar', label: 'Aadhar Number', type: 'text' },
    { key: 'bank_account', label: 'Bank Account', type: 'text' },
    { key: 'ifsc', label: 'IFSC Code', type: 'text' },
  ];

  // Parse PDF form fields using GPT-Vision
  useEffect(() => {
    if (pdfUrl) {
      parsePDFFields();
    }
  }, [pdfUrl]);

  const parsePDFFields = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parse-pdf-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl })
      });

      if (!res.ok) throw new Error('Failed to parse PDF');

      const data = await res.json();
      setParsedFields(data.fields || []);
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      alert('Failed to parse PDF fields. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (pdfFieldName: string) => {
    setDraggedField(pdfFieldName);
  };

  const handleDrop = (profileFieldKey: string) => {
    if (draggedField) {
      const existingIndex = mappings.findIndex(m => m.pdfField === draggedField);
      const newMapping: FieldMapping = {
        pdfField: draggedField,
        profileField: profileFieldKey,
        transformation: getDefaultTransformation(profileFieldKey)
      };

      if (existingIndex >= 0) {
        const updated = [...mappings];
        updated[existingIndex] = newMapping;
        setMappings(updated);
      } else {
        setMappings([...mappings, newMapping]);
      }

      setDraggedField(null);
    }
  };

  const getDefaultTransformation = (fieldKey: string): string => {
    if (fieldKey === 'name') return 'uppercase';
    if (fieldKey === 'phone') return 'phone_format';
    if (fieldKey === 'date') return 'date_format';
    return '';
  };

  const saveMappings = async () => {
    if (!schemeId) {
      alert('Scheme ID is required');
      return;
    }

    try {
      const res = await fetch('/api/save-field-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId,
          mappings,
          pdfUrl
        })
      });

      if (!res.ok) throw new Error('Failed to save mappings');

      alert('Field mappings saved successfully!');
      router.push('/admin/mappings');
    } catch (err: any) {
      console.error('Failed to save mappings:', err);
      alert('Failed to save mappings. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>Field Mapping Editor</h1>
        <p style={{ color: '#666' }}>
          Drag PDF form fields to map them to user profile fields
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginTop: '30px'
        }}>
          {/* PDF Fields (Left) */}
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>PDF Form Fields</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Parsing PDF fields...</p>
              </div>
            ) : (
              <div style={{
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '20px',
                minHeight: '400px',
                background: '#fafafa'
              }}>
                {parsedFields.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <p>No fields found. Click "Parse PDF" to extract fields.</p>
                    <button
                      onClick={parsePDFFields}
                      style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Parse PDF Fields
                    </button>
                  </div>
                ) : (
                  parsedFields.map((field, index) => {
                    const isMapped = mappings.some(m => m.pdfField === field.name);
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(field.name)}
                        onClick={() => setSelectedPdfField(field.name)}
                        style={{
                          padding: '12px',
                          marginBottom: '10px',
                          background: isMapped ? '#e8f5e9' : selectedPdfField === field.name ? '#fff3e0' : 'white',
                          border: selectedPdfField === field.name ? '2px solid #ff9800' : '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'grab',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{field.name}</strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Type: {field.type}
                          </div>
                        </div>
                        {isMapped && <span style={{ color: '#4caf50' }}>✓ Mapped</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Profile Fields (Right) */}
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>User Profile Fields</h2>
            <div
              style={{
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '20px',
                minHeight: '400px',
                background: '#fafafa'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const profileFieldKey = e.currentTarget.dataset.fieldKey;
                if (profileFieldKey) handleDrop(profileFieldKey);
              }}
            >
              {profileFields.map((field) => {
                const mapping = mappings.find(m => m.profileField === field.key);
                return (
                  <div
                    key={field.key}
                    data-field-key={field.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(field.key);
                    }}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      background: mapping ? '#e8f5e9' : 'white',
                      border: mapping ? '2px solid #4caf50' : '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{field.label}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Key: {field.key} | Type: {field.type}
                        </div>
                      </div>
                      {mapping && (
                        <div>
                          <span style={{ color: '#4caf50', fontSize: '12px' }}>
                            ← {mapping.pdfField}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mappings Summary */}
        {mappings.length > 0 && (
          <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Current Mappings ({mappings.length})</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {mappings.map((mapping, index) => {
                const profileField = profileFields.find(f => f.key === mapping.profileField);
                return (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'white',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{mapping.pdfField}</strong> → <strong>{profileField?.label}</strong>
                      {mapping.transformation && (
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                          ({mapping.transformation})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setMappings(mappings.filter((_, i) => i !== index));
                      }}
                      style={{
                        padding: '5px 10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button
            onClick={saveMappings}
            disabled={mappings.length === 0}
            style={{
              padding: '12px 30px',
              background: mappings.length === 0 ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: mappings.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            💾 Save Mappings
          </button>
        </div>
      </div>
    </div>
  );
}



