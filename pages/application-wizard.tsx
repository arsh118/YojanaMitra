// pages/application-wizard.tsx
// Guided Step-by-Step Application Wizard with validation
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';

interface Profile {
  name?: string;
  age?: number;
  phone?: string;
  state?: string;
  income_annual?: number;
  caste?: string;
  education?: string;
  documents?: string[];
  address?: string;
  pincode?: string;
  aadhar?: string;
  bank_account?: string;
  ifsc?: string;
}

interface Scheme {
  id: string;
  title: string;
  description: string;
  required_docs: string[];
  official_portal_url?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

type WizardStep = 'profile' | 'documents' | 'review' | 'submit';

export default function ApplicationWizard() {
  const router = useRouter();
  const { schemeId } = router.query;
  
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    secondary: '#f59e0b',
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
      900: '#111827'
    }
  };
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('profile');
  const [profile, setProfile] = useState<Profile>({});
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file: File; url: string }>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load scheme data
  React.useEffect(() => {
    if (schemeId) {
      fetch(`/api/scheme?id=${schemeId}`)
        .then(res => res.json())
        .then(data => setScheme(data.scheme))
        .catch(err => console.error('Failed to load scheme:', err));
    }
  }, [schemeId]);

  // Load draft if exists
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(`draft_${schemeId}`);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setProfile(draft.profile || {});
      setDraftId(draft.id);
    }
  }, [schemeId]);

  // Auto-save draft
  const saveDraft = async () => {
    if (!schemeId) return;
    
    setSaving(true);
    try {
      const draftData = {
        id: draftId || `draft_${Date.now()}`,
        schemeId,
        profile,
        uploadedDocs: Object.keys(uploadedDocs),
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(`draft_${schemeId}`, JSON.stringify(draftData));
      setDraftId(draftData.id);
      
      // Also save to backend if available
      await fetch('/api/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData)
      });
    } catch (err) {
      console.warn('Failed to save draft:', err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save on profile change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(profile).length > 0) {
        saveDraft();
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [profile]);

  // Validate current step
  const validateStep = (step: WizardStep): boolean => {
    const errors: ValidationError[] = [];

    if (step === 'profile') {
      if (!profile.name || profile.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
      }
      if (!profile.age || profile.age < 18 || profile.age > 100) {
        errors.push({ field: 'age', message: 'Please enter a valid age (18-100)' });
      }
      if (!profile.phone || !/^[6-9]\d{9}$/.test(profile.phone.replace(/\D/g, ''))) {
        errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
      }
      if (!profile.state) {
        errors.push({ field: 'state', message: 'State is required' });
      }
      if (scheme?.required_docs.includes('income_certificate') && !profile.income_annual) {
        errors.push({ field: 'income_annual', message: 'Annual income is required for this scheme' });
      }
    }

    if (step === 'documents') {
      if (!scheme) return true;
      
      scheme.required_docs.forEach((doc: string) => {
        if (!uploadedDocs[doc]) {
          errors.push({ 
            field: doc, 
            message: `${doc.replace(/_/g, ' ').toUpperCase()} is required` 
          });
        }
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle file upload with validation
  const handleFileUpload = async (docType: string, file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setValidationErrors([{ 
        field: docType, 
        message: 'Please upload PDF or image file (JPG/PNG)' 
      }]);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors([{ 
        field: docType, 
        message: 'File size must be less than 5MB' 
      }]);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setUploadedDocs(prev => ({ ...prev, [docType]: { file, url: data.url } }));
      setValidationErrors([]);
      
      // OCR validation for key documents
      if (docType.includes('certificate') || docType.includes('marksheet')) {
        await validateDocumentOCR(docType, data.url);
      }
    } catch (err: any) {
      setValidationErrors([{ field: docType, message: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  // OCR validation for documents
  const validateDocumentOCR = async (docType: string, docUrl: string) => {
    try {
      const res = await fetch('/api/validate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, docUrl, profile })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          setValidationErrors(prev => [...prev, ...data.errors]);
        }
      }
    } catch (err) {
      console.warn('OCR validation failed:', err);
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const steps: WizardStep[] = ['profile', 'documents', 'review', 'submit'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    const steps: WizardStep[] = ['profile', 'documents', 'review', 'submit'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Submit application
  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    setLoading(true);
    try {
      // Convert uploadedDocs to a format that can be serialized (just URLs)
      const documentUrls: Record<string, string> = {};
      Object.keys(uploadedDocs).forEach(docType => {
        if (uploadedDocs[docType]?.url) {
          documentUrls[docType] = uploadedDocs[docType].url;
        }
      });

      const res = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId,
          profile,
          documents: documentUrls,
          draftId
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed');
      }

      const data = await res.json();
      if (data.applicationId) {
        router.push(`/application-success?id=${data.applicationId}`);
      } else {
        throw new Error('Application ID not received from server');
      }
    } catch (err: any) {
      setValidationErrors([{ field: 'submit', message: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'review', label: 'Review', icon: '✓' },
    { id: 'submit', label: 'Submit', icon: '🚀' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '40px',
          position: 'relative'
        }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: index <= currentStepIndex ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` : colors.gray[200],
                  color: index <= currentStepIndex ? 'white' : colors.gray[600],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  transition: 'all 0.3s',
                  boxShadow: index <= currentStepIndex ? `0 4px 12px ${colors.primary}40` : 'none'
                }}>
                  {index < currentStepIndex ? '✓' : step.icon}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: index <= currentStepIndex ? 'bold' : 'normal',
                  color: index <= currentStepIndex ? colors.primary : colors.gray[600]
                }}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: `${(index + 1) * (100 / steps.length)}%`,
                  width: `${100 / steps.length - 10}%`,
                  height: '2px',
                  background: index < currentStepIndex ? colors.primary : colors.gray[200],
                  zIndex: 1,
                  marginLeft: '5%'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '400px' }}>
          {currentStep === 'profile' && (
            <ProfileStep 
              profile={profile}
              setProfile={setProfile}
              errors={validationErrors}
              scheme={scheme}
            />
          )}

          {currentStep === 'documents' && (
            <DocumentsStep
              scheme={scheme}
              uploadedDocs={uploadedDocs}
              onUpload={handleFileUpload}
              errors={validationErrors}
              loading={loading}
              fileInputRefs={fileInputRefs}
            />
          )}

          {currentStep === 'review' && (
            <ReviewStep
              profile={profile}
              scheme={scheme}
              uploadedDocs={uploadedDocs}
            />
          )}

          {currentStep === 'submit' && (
            <SubmitStep
              loading={loading}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid #e0e0e0'
        }}>
          <div>
            {currentStep !== 'profile' && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: '12px 24px',
                  background: colors.gray[200],
                  color: colors.gray[700],
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                ← Previous
              </button>
            )}
            {saving && (
              <span style={{ marginLeft: '15px', color: '#666' }}>
                💾 Saving draft...
              </span>
            )}
          </div>

          <div>
            {currentStep !== 'submit' && (
              <button
                onClick={handleNext}
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
                Next →
              </button>
            )}
            {currentStep === 'submit' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '15px 40px',
                  background: loading ? colors.gray[300] : `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}dd 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: loading ? 'none' : `0 8px 24px ${colors.success}40`
                }}
              >
                {loading ? '⏳ Submitting...' : '🚀 Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Step Component
function ProfileStep({ profile, setProfile, errors, scheme }: any) {
  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '30px' }}>Personal Information</h2>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: errors.find((e: any) => e.field === 'name') ? '2px solid #dc3545' : '2px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="Enter your full name"
          />
          {errors.find((e: any) => e.field === 'name') && (
            <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px', display: 'block' }}>
              {errors.find((e: any) => e.field === 'name')?.message}
            </span>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            Age *
          </label>
          <input
            type="number"
            value={profile.age || ''}
            onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: errors.find((e: any) => e.field === 'age') ? '2px solid #dc3545' : '2px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="Enter your age"
            min="18"
            max="100"
          />
          {errors.find((e: any) => e.field === 'age') && (
            <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px', display: 'block' }}>
              {errors.find((e: any) => e.field === 'age')?.message}
            </span>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: errors.find((e: any) => e.field === 'phone') ? '2px solid #dc3545' : '2px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="10-digit phone number"
            maxLength={10}
          />
          {errors.find((e: any) => e.field === 'phone') && (
            <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px', display: 'block' }}>
              {errors.find((e: any) => e.field === 'phone')?.message}
            </span>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            State *
          </label>
          <select
            value={profile.state || ''}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: errors.find((e: any) => e.field === 'state') ? '2px solid #dc3545' : '2px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value="">Select State</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Bihar">Bihar</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            {/* Add more states */}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            Annual Income (₹)
          </label>
          <input
            type="number"
            value={profile.income_annual || ''}
            onChange={(e) => setProfile({ ...profile, income_annual: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="Enter annual income"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
            Category
          </label>
          <select
            value={profile.caste || ''}
            onChange={(e) => setProfile({ ...profile, caste: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value="">Select Category</option>
            <option value="SC">SC (Scheduled Caste)</option>
            <option value="ST">ST (Scheduled Tribe)</option>
            <option value="OBC">OBC (Other Backward Class)</option>
            <option value="EWS">EWS (Economically Weaker Section)</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Documents Step Component
function DocumentsStep({ scheme, uploadedDocs, onUpload, errors, loading, fileInputRefs }: any) {
  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '30px' }}>Upload Required Documents</h2>
      
      {scheme?.required_docs?.map((doc: string) => (
        <div key={doc} style={{
          marginBottom: '25px',
          padding: '20px',
          border: uploadedDocs[doc] ? '2px solid #28a745' : '2px dashed #ddd',
          borderRadius: '10px',
          background: uploadedDocs[doc] ? '#f0fff4' : '#fafafa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                {doc.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Upload clear scan (PDF, JPG, or PNG, max 5MB)
              </p>
            </div>
            <div>
              <input
                ref={(el) => { fileInputRefs.current[doc] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(doc, file);
                }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRefs.current[doc]?.click()}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: uploadedDocs[doc] ? '#28a745' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {uploadedDocs[doc] ? '✓ Uploaded' : '📤 Upload'}
              </button>
            </div>
          </div>
          {errors.find((e: any) => e.field === doc) && (
            <span style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px', display: 'block' }}>
              {errors.find((e: any) => e.field === doc)?.message}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Review Step Component
function ReviewStep({ profile, scheme, uploadedDocs }: any) {
  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '30px' }}>Review Your Application</h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0 }}>Scheme: {scheme?.title}</h3>
          <p>{scheme?.description}</p>
        </div>

        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0 }}>Your Information</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
          <h3 style={{ marginTop: 0 }}>Uploaded Documents</h3>
          <ul>
            {Object.keys(uploadedDocs).map(doc => (
              <li key={doc} style={{ marginBottom: '10px' }}>
                ✓ {doc.replace(/_/g, ' ').toUpperCase()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Submit Step Component
function SubmitStep({ loading, onSubmit }: any) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Ready to Submit!</h2>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '18px' }}>
        Review your application and click submit to complete the process.
      </p>
      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          padding: '15px 40px',
          background: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        {loading ? '⏳ Submitting...' : '🚀 Submit Application'}
      </button>
    </div>
  );
}

