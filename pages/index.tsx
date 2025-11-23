// pages/index.tsx - Modern, Professional UI
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
}

interface Scheme {
  id: string;
  title: string;
  description: string;
  state: string;
  eligibility: any;
  required_docs: string[];
  source_url: string;
  official_portal_url?: string;
  application_url?: string;
}

interface MatchResult {
  scheme: Scheme;
  score: number;
  confidence: number;
  confidenceLevel: string;
  explanation: string;
  missingFields: string[];
  needsReview: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'profile' | 'schemes' | 'filling' | 'complete'>('input');
  const [text, setText] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedSchemes, setSavedSchemes] = useState<string[]>([]);
  const [allSchemes, setAllSchemes] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<MatchResult[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<any>(null);
  const [kitDownloading, setKitDownloading] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [fillStatus, setFillStatus] = useState<any>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [sendingKitWhatsapp, setSendingKitWhatsapp] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showChecklistGenerator, setShowChecklistGenerator] = useState(false);
  const [checklistStep, setChecklistStep] = useState(0);
  const [checklistAnswers, setChecklistAnswers] = useState<any>({});
  const [checklistResult, setChecklistResult] = useState<string | null>(null);
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Load user data from localStorage if available (optional)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.loggedIn) {
          setUser(parsed);
          setProfile({
            name: parsed.name,
            phone: parsed.phone
          });
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }
  }, []);

  // Load saved schemes
  useEffect(() => {
    const saved = localStorage.getItem('savedSchemes');
    if (saved) {
      try {
        setSavedSchemes(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved schemes:', err);
      }
    }
  }, []);

  // Load all schemes for search
  useEffect(() => {
    fetch('/data/schemes.json')
      .then(res => {
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Failed to load schemes: Invalid response format');
        }
        return res.json();
      })
      .then(data => setAllSchemes(data))
      .catch(err => {
        console.error('Failed to load schemes:', err);
        // Try to load from API as fallback
        fetch('/api/scheme?all=true')
          .then(res => res.json())
          .then(data => {
            if (data.schemes) {
              setAllSchemes(data.schemes);
            }
          })
          .catch(() => {
            // If both fail, set empty array to prevent errors
            setAllSchemes([]);
          });
      });
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const results = allSchemes.filter(scheme => 
        scheme.title.toLowerCase().includes(query) ||
        scheme.description.toLowerCase().includes(query) ||
        scheme.state.toLowerCase().includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allSchemes]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
          searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Translations
  const translations: any = {
    EN: {
      home: 'Home',
      dashboard: 'Dashboard',
      profile: 'Profile',
      myApplications: 'My Applications',
      savedSchemes: 'Saved Schemes',
      settings: 'Settings',
      logout: 'Logout',
      searchPlaceholder: '🔎 Search schemes, benefits, forms...',
      newApplication: '+ New Application',
      upload: '📄 Upload'
    },
    HI: {
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      profile: 'प्रोफ़ाइल',
      myApplications: 'मेरे आवेदन',
      savedSchemes: 'सहेजे गए योजनाएं',
      settings: 'सेटिंग्स',
      logout: 'लॉगआउट',
      searchPlaceholder: '🔎 योजनाएं, लाभ, फॉर्म खोजें...',
      newApplication: '+ नया आवेदन',
      upload: '📄 अपलोड'
    }
  };

  const t = translations[language] || translations.EN;

  // Colors definition (needed before auth check)
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
      900: '#111827',
    },
  };


  // Save scheme function
  const handleSaveScheme = (schemeId: string) => {
    const saved = JSON.parse(localStorage.getItem('savedSchemes') || '[]');
    if (!saved.includes(schemeId)) {
      saved.push(schemeId);
      localStorage.setItem('savedSchemes', JSON.stringify(saved));
      setSavedSchemes(saved);
      alert('Scheme saved!');
    } else {
      const updated = saved.filter((id: string) => id !== schemeId);
      localStorage.setItem('savedSchemes', JSON.stringify(updated));
      setSavedSchemes(updated);
      alert('Scheme removed from saved!');
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        setLoading(true);
        try {
          const res = await fetch('/api/whisper', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.text) {
            setText(data.text);
          }
        } catch (err: any) {
          setError('Failed to transcribe audio: ' + err.message);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Failed to access microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleExtractProfile = async () => {
    if (!text.trim()) {
      setError('Please enter your information first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract profile');
      }

      const data = await res.json();
      setProfile(data.profile);
      // Save profile to localStorage
      localStorage.setItem('profile', JSON.stringify(data.profile));
      setStep('profile');
    } catch (err: any) {
      setError(err.message || 'Failed to extract profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSchemes = async () => {
    if (!profile) {
      setError('Please extract profile first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to match schemes');
      }

      const data = await res.json();
      setSchemes(data.results || []);
      setStep('schemes');
    } catch (err: any) {
      setError(err.message || 'Failed to match schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEligibility = async (schemeId: string) => {
    setCheckingEligibility(true);
    try {
      // Find the scheme details
      const scheme = allSchemes.find(s => s.id === schemeId);
      if (!scheme) {
        alert('Scheme not found. Please try again.');
        setCheckingEligibility(false);
        return;
      }

      // If profile exists, use eligibility builder API
      if (profile && Object.keys(profile).length > 0) {
        const res = await fetch('/api/eligibility-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, schemeId })
        });

        if (res.ok) {
          const data = await res.json();
          setEligibilityData(data.result);
          setSelectedScheme({
            scheme: scheme,
            score: data.result.score || 0.8,
            confidence: data.result.confidence || 0.8,
            confidenceLevel: data.result.confidenceLevel || 'High',
            explanation: data.result.explanation || 'Eligibility check completed',
            missingFields: data.result.missingFields || [],
            needsReview: data.result.needsReview || false
          });
          setCheckingEligibility(false);
          return;
        }
      }

      // If no profile, show general scheme eligibility information
      const eligibilityCriteria = scheme.eligibility 
        ? (typeof scheme.eligibility === 'string' 
            ? scheme.eligibility 
            : Object.entries(scheme.eligibility).map(([key, value]) => `• ${key}: ${value}`).join('\n'))
        : 'Check official website for detailed eligibility criteria.';

      const explanation = `📋 **${scheme.title}**

📍 **State:** ${scheme.state}

📝 **Description:**
${scheme.description}

✅ **Eligibility Criteria:**
${eligibilityCriteria}

📄 **Required Documents:**
${scheme.required_docs && scheme.required_docs.length > 0 
  ? scheme.required_docs.map(doc => `• ${doc}`).join('\n')
  : 'Check official website for required documents'}

🔗 **Official Portal:** ${scheme.official_portal_url || scheme.source_url || 'N/A'}

💡 **Tip:** Fill in your profile information to get personalized eligibility analysis!`;

      // Set eligibility data and selected scheme to display in UI
      setEligibilityData({
        scheme: scheme.title,
        explanation: explanation,
        score: 0.5,
        confidence: 0.5,
        confidenceLevel: 'Medium',
        nextActions: [
          { action: 'Fill in your profile for personalized eligibility check' },
          { action: `Visit official portal: ${scheme.official_portal_url || scheme.source_url || 'N/A'}` },
          { action: 'Check required documents and prepare them in advance' }
        ]
      });

      setSelectedScheme({
        scheme: scheme,
        score: 0.5,
        confidence: 0.5,
        confidenceLevel: 'Medium',
        explanation: explanation,
        missingFields: [],
        needsReview: false
      });

      // Show eligibility information
      // If we're in the schemes step, the UI will display it automatically
      // Otherwise, show an alert with the key information
      if (step !== 'schemes' || schemes.length === 0) {
        const alertMessage = `📋 ${scheme.title}\n\n📍 State: ${scheme.state}\n\n📝 ${scheme.description}\n\n✅ Eligibility: ${eligibilityCriteria.substring(0, 200)}...\n\n📄 Required Docs: ${scheme.required_docs?.join(', ') || 'Check website'}\n\n💡 Fill in your profile for personalized analysis!`;
        alert(alertMessage);
      } else {
        // Scroll to schemes section to show the eligibility details
        setTimeout(() => {
          const schemesSection = document.getElementById('schemes-section');
          if (schemesSection) {
            schemesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Failed to check eligibility:', err);
      alert('Failed to check eligibility. Please try again.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleUploadPDF = async (file: File) => {
    setPdfUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const data = await res.json();
      setUploadedPdfUrl(data.url);
      return data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF');
      return null;
    } finally {
      setPdfUploading(false);
    }
  };

  const handleFillPDF = async () => {
    if (!selectedScheme || !profile) {
      setError('Please select a scheme first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fillpdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          scheme: selectedScheme.scheme,
          pdfUrl: uploadedPdfUrl || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fill PDF');
      }

      const data = await res.json();
      setFilledPdfUrl(data.url || data.filledPdfUrl);
      setGeneratedDocs(data.generatedDocs);
      setFillStatus(data);
      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to fill PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadKit = async () => {
    // If no filled PDF, try to generate one first
    if (!filledPdfUrl) {
      if (!selectedScheme || !profile) {
        setError('Please fill the PDF form first or select a scheme');
      return;
      }
      
      // Try to fill PDF automatically
      setKitDownloading(true);
      try {
        await handleFillPDF();
        // Wait a bit for the PDF to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: any) {
        setError('Please upload and fill a PDF form first');
        setKitDownloading(false);
        return;
      }
    }

    setKitDownloading(true);
    setError(null);

    try {
      // Prepare files array for the kit
      const files: Array<{ url: string; name: string }> = [];

      if (filledPdfUrl) {
        files.push({ url: filledPdfUrl, name: 'FilledForm.pdf' });
      }
      
      if (generatedDocs && typeof generatedDocs === 'object') {
        Object.values(generatedDocs).forEach((doc: any) => {
          if (doc && doc.url) {
            files.push({
              url: doc.url,
              name: `${doc.type ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1) : 'Document'}.txt`
            });
          }
        });
      }

      if (files.length === 0) {
        throw new Error('No files available to download. Please fill the PDF form first.');
      }

      const res = await fetch('/api/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          schemeTitle: selectedScheme?.scheme.title,
          userName: profile?.name
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download kit');
      }

      // Create a blob from the response and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedScheme?.scheme.title?.replace(/[^a-z0-9]/gi, '_') || 'application'}_kit.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download kit');
    } finally {
      setKitDownloading(false);
    }
  };

  const handleSendFormData = async (silent = false) => {
    if (!profile?.phone) {
      if (!silent) setError('Phone number is required to send form data to WhatsApp.');
      return false;
    }
    if (!selectedScheme) {
      if (!silent) setError('No scheme selected to send form data.');
      return false;
    }

    setSendingWhatsapp(true);
    if (!silent) setError(null);

    try {
      const portalUrl = selectedScheme.scheme.official_portal_url || selectedScheme.scheme.application_url || selectedScheme.scheme.source_url || 'Not available';

      const res = await fetch('/api/send-form-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          scheme: selectedScheme.scheme,
          filledFields: fillStatus?.filledFields || [],
          portalUrl
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Failed to send form data via WhatsApp';
        const hint = errorData.hint || 'Please check Twilio configuration';
        throw new Error(`${errorMsg}\n\n💡 ${hint}`);
      }

      const result = await res.json();
      if (!silent) alert(`✅ Form data successfully sent to WhatsApp! (Number: ${profile.phone})\n\nPortal Link: ${result.portalUrl}`);
      setWhatsappSent(true);
      return true;
    } catch (err: any) {
      console.error('Error sending form data to WhatsApp:', err);
      if (!silent) setError(err.message || 'Failed to send form data via WhatsApp. Please check Twilio configuration.');
      return false;
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleSendKitWhatsapp = async () => {
    if (!filledPdfUrl) {
      setError('Filled PDF is required to send kit');
      return;
    }

    setSendingKitWhatsapp(true);
    setError(null);

    try {
      const files: Array<{ url: string; name: string }> = [
        { url: filledPdfUrl, name: 'FilledForm.pdf' }
      ];

      if (generatedDocs && typeof generatedDocs === 'object') {
        Object.values(generatedDocs).forEach((doc: any) => {
          if (doc && doc.url) {
            files.push({
              url: doc.url,
              name: `${doc.type ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1) : 'Document'}.txt`
            });
          }
        });
      }

      if (files.length === 0) {
        throw new Error('No files available to send');
      }

      const res = await fetch('/api/send-kit-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          schemeTitle: selectedScheme?.scheme.title,
          userName: profile?.name,
          filledPdfUrl,
          generatedDocs
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Failed to send kit via WhatsApp';
        const hint = errorData.hint || 'Please check Twilio configuration';
        const kitUrl = errorData.kitUrl;

        let fullError = errorMsg;
        if (hint) {
          fullError += `\n\n💡 ${hint}`;
        }
        if (kitUrl) {
          fullError += `\n\n📥 You can still download the kit manually: ${kitUrl}`;
        }
        setError(fullError);
      return;
      }

      const result = await res.json();
      alert(`✅ Application kit successfully sent to WhatsApp! (Number: ${result.whatsappNumber})\n\nDownload link: ${result.kitUrl || 'Check your WhatsApp'}`);
    } catch (err: any) {
      console.error('Error sending kit to WhatsApp:', err);
      setError(err.message || 'Failed to send kit via WhatsApp. Please check Twilio configuration.');
    } finally {
      setSendingKitWhatsapp(false);
    }
  };

  useEffect(() => {
    if (step === 'complete' && profile?.phone && !whatsappSent && !sendingWhatsapp) {
      const timer = setTimeout(() => {
        console.log('Attempting to auto-send form data to WhatsApp...');
        handleSendFormData(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, profile?.phone, whatsappSent, sendingWhatsapp]);

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, ${colors.secondary} 100%)`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Abstract Background Shapes */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-10%',
        width: '800px',
        height: '800px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-15%',
        left: '-10%',
        width: '700px',
        height: '700px',
        background: 'rgba(245, 158, 11, 0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'float 25s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'rgba(16, 185, 129, 0.05)',
        borderRadius: '50%',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'float 30s ease-in-out infinite'
      }} />
      {/* Premium Header with All Features */}
      <header style={{
        background: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
        padding: '12px 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: `2px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1400px',
        margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Left: Logo + Name + Badge + Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
              >
                🇮🇳
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '800',
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.5px'
                  }}>
                    YojanaMitra
        </h1>
                  <span style={{
                    padding: '2px 8px',
                    background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}dd 100%)`,
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}>
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Center: Global AI Search Bar */}
          <div style={{
            flex: '1 1 auto',
            maxWidth: '500px',
            position: 'relative',
            margin: '0 24px'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.9)',
                  border: `2px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200]}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: darkMode ? 'white' : colors.gray[900],
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 4px 12px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200];
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              />
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  padding: '8px',
                  background: isRecording ? colors.danger : 'transparent',
                  color: isRecording ? 'white' : colors.gray[500],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.background = colors.gray[100];
                    e.currentTarget.style.color = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRecording) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = colors.gray[500];
                  }
                }}
              >
                🎙️
              </button>
            </div>
            {showSearchResults && searchQuery && (
              <div 
                ref={searchResultsRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.98)' : 'white',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200]}`,
                  padding: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 1001
                }}
              >
                {searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((scheme) => (
                      <Link
                        key={scheme.id}
                        href={`/application-wizard?schemeId=${scheme.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        style={{
                          display: 'block',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderBottom: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.1)' : colors.gray[100]}`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.primary + '10';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: darkMode ? 'white' : colors.gray[900],
                            marginBottom: '4px'
                          }}>
                            {scheme.title}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: colors.gray[600],
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {scheme.description}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: colors.primary,
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{scheme.state}</span>
                            <span>•</span>
                            <span style={{ fontWeight: '600' }}>Click to apply →</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    color: colors.gray[600],
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    No schemes found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Theme Toggle + Notifications + Language + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: '0 0 auto'
          }}>
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '10px',
                background: darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.gray[100],
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
              }}
            >
              {darkMode ? '🌙' : '🌞'}
            </button>

            {/* Notification Bell */}
            <div ref={notificationsRef} style={{ position: 'relative' }}>
                <button
                onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                  padding: '10px',
                  background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.gray[100];
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🔔
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  background: colors.danger,
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
                </button>
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.98)' : 'white',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200]}`,
                  padding: '16px',
                  zIndex: 1001
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: darkMode ? 'white' : colors.gray[900]
                  }}>
                    Notifications
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { type: 'deadline', text: 'PM Scholarship deadline in 3 days', time: '2h ago' },
                      { type: 'document', text: 'Income certificate required', time: '5h ago' },
                      { type: 'status', text: 'Application status updated', time: '1d ago' }
                    ].map((notif, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          background: darkMode ? 'rgba(59, 130, 246, 0.1)' : colors.gray[50],
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.gray[100];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : colors.gray[50];
                        }}
                      >
                        <div style={{
                          fontSize: '13px',
                          color: darkMode ? 'white' : colors.gray[900],
                          marginBottom: '4px'
                        }}>
                          {notif.text}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: colors.gray[500]
                        }}>
                          {notif.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>

            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  const langs = ['EN', 'HI', 'BN', 'ML', 'TA', 'TE'];
                  const currentIndex = langs.indexOf(language);
                  setLanguage(langs[(currentIndex + 1) % langs.length]);
                }}
                style={{
                  padding: '8px 12px',
                  background: darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.gray[100],
                  border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: darkMode ? 'white' : colors.gray[900],
                  transition: 'all 0.2s',
                  minWidth: '50px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.gray[100];
                }}
              >
                {language}
              </button>
            </div>

            {/* Profile Avatar with Dropdown */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  border: '2px solid white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }}
              >
                {user?.name?.[0]?.toUpperCase() || profile?.name?.[0]?.toUpperCase() || 'U'}
            </button>
              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '220px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.98)' : 'white',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : colors.gray[200]}`,
                  padding: '8px',
                  zIndex: 1001
                }}>
                  {[
                    { icon: '👤', label: t.profile, href: '/profile', onClick: () => {
                      setShowProfileDropdown(false);
                      router.push('/profile');
                    }},
                    { icon: '📋', label: t.myApplications, href: '/applications', onClick: () => setShowProfileDropdown(false) },
                    { icon: '⭐', label: t.savedSchemes, href: '#', onClick: () => {
                      setShowProfileDropdown(false);
                      router.push('/saved-schemes');
                    }},
                    { icon: '⚙️', label: t.settings, href: '#', onClick: () => {
                      setShowProfileDropdown(false);
                      router.push('/settings');
                    }},
                    { icon: '🚪', label: t.logout, href: '#', danger: true, onClick: () => {
                      localStorage.removeItem('user');
                      setUser(null);
                      setProfile(null);
                      // Refresh the page to clear state
                      window.location.reload();
                    }}
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={item.onClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        color: item.danger ? colors.danger : (darkMode ? 'white' : colors.gray[900]),
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = item.danger ? colors.danger + '10' : (darkMode ? 'rgba(59, 130, 246, 0.2)' : colors.gray[100]);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
          </div>
        )}
            </div>
          </div>
        </div>

        {/* Breadcrumb / Page Indicator */}
            <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '8px 24px 0',
          borderTop: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.1)' : colors.gray[200]}`,
          marginTop: '8px',
          paddingTop: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : colors.gray[600]
          }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span style={{ color: darkMode ? 'white' : colors.gray[900], fontWeight: '600' }}>
              {step === 'input' ? t.dashboard : step === 'profile' ? t.profile : step === 'schemes' ? 'Schemes' : step === 'complete' ? 'Application Complete' : t.dashboard}
            </span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        {/* Premium Hero Section - Only on input step */}
        {step === 'input' && (
          <>
            {/* Layered Gradient Hero with Abstract Shapes */}
            <div style={{
              position: 'relative',
              textAlign: 'center',
              marginBottom: '64px',
              color: 'white',
              padding: '80px 24px',
              borderRadius: '32px',
              background: `linear-gradient(135deg, 
                ${colors.primary} 0%, 
                ${colors.primaryDark} 50%, 
                ${colors.secondary} 100%)`,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3)'
            }}>
              {/* Abstract Shapes Background */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                animation: 'float 6s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '500px',
                height: '500px',
                background: 'rgba(245, 158, 11, 0.15)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite reverse'
              }} />
              
              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes shimmer {
                  0% { background-position: -1000px 0; }
                  100% { background-position: 1000px 0; }
                }
                @keyframes typewriter {
                  from { width: 0; }
                  to { width: 100%; }
                }
              `}</style>

              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: '900',
                marginBottom: '24px',
                textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                letterSpacing: '-0.02em',
                position: 'relative',
                zIndex: 1
              }}>
                Find Your Perfect Government Scheme
              </h2>
              <p style={{
                fontSize: 'clamp(18px, 2vw, 24px)',
                marginBottom: '48px',
                opacity: 0.95,
                maxWidth: '700px',
                margin: '0 auto 48px',
                lineHeight: '1.6',
                position: 'relative',
                zIndex: 1,
                fontWeight: '300'
              }}>
                Tell us about yourself, and our AI will match you with eligible schemes instantly
              </p>

              {/* Premium Glass-morphism Feature Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginTop: '48px',
                position: 'relative',
                zIndex: 1
              }}>
                {[
                  { icon: '🎯', title: 'Smart Matching', desc: 'AI-powered scheme matching with explainable eligibility', color: 'rgba(16, 185, 129, 0.2)' },
                  { icon: '📝', title: 'Auto-Fill Forms', desc: 'Automatically fill PDF forms with your information', color: 'rgba(59, 130, 246, 0.2)' },
                  { icon: '📱', title: 'WhatsApp Integration', desc: 'Get reminders and updates via WhatsApp', color: 'rgba(245, 158, 11, 0.2)' }
                ].map((card, idx) => (
                  <div
                    key={idx}
              style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: '24px',
                      padding: '32px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${card.color}, transparent)`,
                      opacity: 0.6
                    }} />
                    <div style={{ fontSize: '48px', marginBottom: '16px', transform: 'scale(1)' }}>{card.icon}</div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700' }}>{card.title}</h3>
                    <p style={{ margin: 0, fontSize: '15px', opacity: 0.95, lineHeight: '1.5' }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Categories Section */}
            <div style={{ marginBottom: '64px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '32px',
                  fontWeight: '800',
                color: 'white',
                  margin: 0,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  Most Popular Categories
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                  fontSize: '16px'
                }}>
                  Quick access to top schemes
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px'
              }}>
                {[
                  { icon: '🎓', title: 'Scholarships', color: '#3b82f6' },
                  { icon: '♿', title: 'Disability Benefits', color: '#10b981' },
                  { icon: '👩‍💼', title: 'Women Empowerment', color: '#f59e0b' },
                  { icon: '🌾', title: 'Farmers', color: '#84cc16' },
                  { icon: '🧓', title: 'Senior Citizens', color: '#8b5cf6' },
                  { icon: '🏢', title: 'MSME/Business', color: '#ef4444' }
                ].map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setText(`I am looking for ${cat.title.toLowerCase()} schemes`);
                      setStep('input');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '28px 20px',
                      textAlign: 'center',
                cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: `2px solid ${cat.color}20`,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = `0 12px 40px ${cat.color}40`;
                      e.currentTarget.style.borderColor = cat.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = `${cat.color}20`;
                    }}
                  >
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '12px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}>
                      {cat.icon}
          </div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color: colors.gray[900]
                    }}>
                      {cat.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Status Tracking Preview */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '48px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: colors.gray[900],
                  margin: 0
                }}>
                  📊 Track Your Applications
                </h3>
                <Link href="/applications" style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primaryDark;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.primary;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  View All →
                </Link>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {[
                  { name: 'PM Scholarship', status: 'Pending Docs', color: colors.warning, progress: 60 },
                  { name: 'Kanya Sumangala Yojana', status: 'Submitted', color: colors.primary, progress: 100 },
                  { name: 'UDYAM Registration', status: 'Completed', color: colors.success, progress: 100 }
                ].map((app, idx) => (
                <div
                  key={idx}
                  style={{
                      background: colors.gray[50],
                      borderRadius: '16px',
                    padding: '20px',
                      border: `2px solid ${app.color}20`,
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = app.color;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${app.color}20`;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                    <div>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.gray[900]
                        }}>
                          {app.name}
                        </h4>
                        <span style={{
                          padding: '4px 12px',
                          background: `${app.color}20`,
                          color: app.color,
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      height: '6px',
                      background: colors.gray[200],
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${app.progress}%`,
                        background: `linear-gradient(90deg, ${app.color}, ${app.color}dd)`,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Checklist Generator */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '48px',
              boxShadow: '0 12px 40px rgba(37, 99, 235, 0.25)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  marginBottom: '12px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  📋 Generate Your Personalized Document Checklist
                      </h3>
                <p style={{
                  fontSize: '16px',
                  marginBottom: '24px',
                  opacity: 0.95
                }}>
                  Answer a few questions and get a customized list of required documents in one tap
                </p>
                <button
                  onClick={() => {
                    setShowChecklistGenerator(true);
                    setChecklistStep(0);
                    setChecklistAnswers({});
                    setChecklistResult(null);
                  }}
                  style={{
                    padding: '16px 32px',
                    background: 'white',
                    color: colors.primary,
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                  }}
                >
                  Generate Checklist →
                </button>
                    </div>
            </div>

            {/* Recently Added Schemes */}
            <div style={{ marginBottom: '48px' }}>
                      <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '800',
                        color: 'white',
                  margin: 0,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}>
                  🔥 Recently Added Schemes
                </h3>
                      </div>
                        <div style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                paddingBottom: '16px',
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.primary} transparent`
              }}>
                {allSchemes.slice(-3).map((scheme) => {
                  // Get icon based on scheme title
                  const getIcon = (title: string) => {
                    if (title.toLowerCase().includes('kisan') || title.toLowerCase().includes('farmer')) return '🌾';
                    if (title.toLowerCase().includes('health') || title.toLowerCase().includes('ayushman')) return '🏥';
                    if (title.toLowerCase().includes('awas') || title.toLowerCase().includes('housing')) return '🏠';
                    if (title.toLowerCase().includes('scholarship')) return '🎓';
                    if (title.toLowerCase().includes('msme') || title.toLowerCase().includes('business')) return '🏢';
                    return '📋';
                  };
                  
                  return (
                  <div
                    key={scheme.id}
                    style={{
                      minWidth: '320px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                          borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                      <div style={{
                        fontSize: '40px',
                        background: `${colors.primary}15`,
                        borderRadius: '12px',
                        padding: '12px',
                        width: '64px',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getIcon(scheme.title)}
                        </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '700',
                            color: colors.gray[900]
                          }}>
                            {scheme.title}
                          </h4>
                          <span style={{
                            padding: '2px 8px',
                            background: scheme.state === 'All' ? colors.primary + '20' : colors.success + '20',
                            color: scheme.state === 'All' ? colors.primary : colors.success,
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {scheme.state === 'All' ? 'Central' : scheme.state}
                          </span>
                        </div>
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          color: colors.gray[600]
                        }}>
                          {scheme.description}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a
                            href="#"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (scheme.id) {
                                setSelectedScheme({
                                  scheme: scheme,
                                  score: 0.8,
                                  confidence: 0.8,
                                  confidenceLevel: 'High',
                                  explanation: 'Checking eligibility...',
                                  missingFields: [],
                                  needsReview: false
                                });
                                await handleCheckEligibility(scheme.id);
                              }
                            }}
                            style={{
                              fontSize: '13px',
                              color: colors.primary,
                              textDecoration: 'none',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            AI explains eligibility →
                          </a>
                          <button
                            onClick={() => handleSaveScheme(scheme.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '18px',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title={savedSchemes.includes(scheme.id) ? 'Remove from saved' : 'Save scheme'}
                          >
                            {savedSchemes.includes(scheme.id) ? '⭐' : '☆'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
                    </div>
                  </div>

            {/* Testimonials / Social Proof */}
                  <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {[
                { name: 'Rahul', text: 'Helped me find 4 schemes in 5 minutes', rating: 5 },
                { name: 'Neha', text: 'Application filling became super easy', rating: 5 },
                { name: 'Priya', text: 'Saved hours of research time', rating: 5 }
              ].map((testimonial, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '28px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '12px',
                    color: colors.warning
                  }}>
                    {'⭐'.repeat(testimonial.rating)}
                  </div>
                  <p style={{
                    margin: '0 0 16px 0',
                    fontSize: '15px',
                    color: colors.gray[700],
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    "{testimonial.text}"
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: colors.gray[900],
                        fontSize: '14px'
                      }}>
                        {testimonial.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.gray[500]
                      }}>
                        Verified User
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                  </div>

            {/* Developer Corner / Transparency Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              marginBottom: '48px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: colors.gray[900],
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                Transparency & Security
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {[
                  { icon: '🤖', title: 'AI-Powered', desc: 'Advanced machine learning algorithms' },
                  { icon: '🔐', title: 'Data Encrypted', desc: 'End-to-end encryption' },
                  { icon: '✅', title: 'Secure Aggregator', desc: 'Official government sources only' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      background: colors.gray[50],
                      borderRadius: '16px',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.primary + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.gray[50];
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: colors.gray[900]
                    }}>
                      {item.title}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: colors.gray[600]
                    }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
                    </div>
            </div>
          </>
        )}

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: colors.danger,
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: `1px solid ${colors.danger}20`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <strong>Error:</strong> {error.split('\n')[0]}
                {error.includes('\n') && (
                  <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
                    {error.split('\n').slice(1).join('\n')}
                  </div>
                )}
              </div>
                  <button
                onClick={() => setError(null)}
                  style={{
                  background: 'none',
                    border: 'none',
                  fontSize: '20px',
                    cursor: 'pointer',
                  color: colors.danger,
                  padding: '0',
                  width: '24px',
                  height: '24px'
                }}
              >
                ×
                </button>
              </div>
          )}

          {/* Step 1: Input */}
          {step === 'input' && (
            <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: colors.gray[900],
                marginBottom: '8px'
              }}>
                Tell Us About Yourself
              </h2>
              <p style={{
                color: colors.gray[600],
                marginBottom: '32px',
                fontSize: '16px'
              }}>
                Share your details in natural language. For example: "I am 25 years old, from Uttar Pradesh, annual income 2 lakhs, SC category, pursuing post-graduation"
              </p>

              <div style={{
                position: 'relative',
                marginBottom: '24px'
              }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your information here... (e.g., Name, Age, State, Income, Category, Education)"
                style={{
                  width: '100%',
                    minHeight: '200px',
                    padding: '20px',
                    borderRadius: '12px',
                    border: `2px solid ${colors.gray[200]}`,
                  fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray[200]}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    style={{
                      padding: '12px 20px',
                      background: isRecording ? colors.danger : colors.gray[100],
                      color: isRecording ? 'white' : colors.gray[700],
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isRecording ? `0 4px 12px ${colors.danger}40` : 'none'
                    }}
                  >
                    {isRecording ? '⏹️ Stop Recording' : '🎤 Voice Input'}
                  </button>
                </div>
            </div>

              {audioUrl && (
                <div style={{ marginBottom: '24px' }}>
                  <audio controls src={audioUrl} style={{ width: '100%' }} />
                </div>
              )}

            <button
              onClick={handleExtractProfile}
              disabled={loading || !text.trim()}
                    style={{
                      width: '100%',
                  padding: '16px 32px',
                  background: loading || !text.trim() ? colors.gray[300] : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      color: 'white',
                      border: 'none',
                  borderRadius: '12px',
                  cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                  fontWeight: '600',
                  boxShadow: loading || !text.trim() ? 'none' : `0 8px 24px ${colors.primary}40`,
                  transition: 'all 0.2s'
              }}
            >
                {loading ? '⏳ Processing...' : '✨ Extract Profile & Find Schemes'}
                  </button>
          </div>
        )}

        {/* Step 2: Profile Review */}
        {step === 'profile' && profile && (
          <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: colors.gray[900],
                marginBottom: '24px'
              }}>
                Review Your Profile
              </h2>

            <div style={{
                background: colors.gray[50],
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {Object.entries(profile).map(([key, value]) => (
                    <div key={key}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors.gray[500],
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}>
                        {key.replace(/_/g, ' ')}
            </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: colors.gray[900]
                      }}>
                        {String(value || 'Not provided')}
                      </div>
                </div>
              ))}
                </div>
            </div>

              <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep('input')}
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
                  ← Edit
                </button>
                <button
                  onClick={handleMatchSchemes}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: loading ? colors.gray[300] : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: loading ? 'none' : `0 4px 12px ${colors.primary}40`
              }}
            >
                  {loading ? '⏳ Finding Schemes...' : '🔍 Find Matching Schemes →'}
            </button>
              </div>
          </div>
        )}

          {/* Step 3: Schemes */}
          {step === 'schemes' && schemes.length > 0 && (
          <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: colors.gray[900],
                marginBottom: '8px'
              }}>
                Matched Schemes
            </h2>
              <p style={{
                color: colors.gray[600],
                marginBottom: '32px',
                fontSize: '16px'
              }}>
                Found {schemes.length} scheme{schemes.length !== 1 ? 's' : ''} that match your profile
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {schemes.map((result, index) => (
                  <div
                    key={result.scheme.id}
                    onClick={() => {
                      setSelectedScheme(result);
                      handleCheckEligibility(result.scheme.id);
                    }}
                  style={{
                      background: selectedScheme?.scheme.id === result.scheme.id ? colors.primary + '10' : colors.gray[50],
                      border: `2px solid ${selectedScheme?.scheme.id === result.scheme.id ? colors.primary : colors.gray[200]}`,
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedScheme?.scheme.id !== result.scheme.id) {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.background = colors.primary + '05';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedScheme?.scheme.id !== result.scheme.id) {
                        e.currentTarget.style.borderColor = colors.gray[200];
                        e.currentTarget.style.background = colors.gray[50];
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '20px',
                          fontWeight: '700',
                          color: colors.gray[900]
                        }}>
                        {result.scheme.title}
                      </h3>
                        <p style={{
                          margin: '0 0 12px 0',
                          color: colors.gray[600],
                          fontSize: '14px'
                        }}>
                        {result.scheme.description}
                      </p>
                    </div>
            <div style={{
                        padding: '8px 16px',
                        background: result.confidenceLevel === 'High' ? colors.success + '20' : 
                                   result.confidenceLevel === 'Medium' ? colors.warning + '20' : 
                                   colors.danger + '20',
                        color: result.confidenceLevel === 'High' ? colors.success : 
                               result.confidenceLevel === 'Medium' ? colors.warning : 
                               colors.danger,
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {result.confidenceLevel} Match
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: colors.gray[700]
                    }}>
                      {result.explanation}
                  </div>

                    {eligibilityData && selectedScheme?.scheme.id === result.scheme.id && (
                      <div style={{
                        background: colors.primary + '10',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '12px',
                        border: `1px solid ${colors.primary}30`
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '20px' }}>🎯</span>
                          <strong style={{ color: colors.primary }}>Eligibility Analysis</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: colors.gray[700], marginBottom: '8px' }}>
                          {eligibilityData.explanation}
                        </div>
                        {eligibilityData.nextActions && eligibilityData.nextActions.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <strong style={{ fontSize: '12px', color: colors.gray[600] }}>Next Steps:</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: colors.gray[600] }}>
                              {eligibilityData.nextActions.slice(0, 3).map((action: any, i: number) => (
                                <li key={i}>{action.action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
          </div>
        )}

                    {selectedScheme?.scheme.id === result.scheme.id && (
                      <div style={{ marginTop: '16px' }}>
                        {/* PDF Upload Section */}
                        <div style={{
                          background: colors.gray[50],
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '12px',
                          border: `2px dashed ${uploadedPdfUrl ? colors.success : colors.gray[300]}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '20px' }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                margin: '0 0 4px 0',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: colors.gray[900]
                              }}>
                                Upload PDF Form (Optional)
                              </h4>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: colors.gray[600]
                              }}>
                                {uploadedPdfUrl 
                                  ? 'PDF uploaded successfully' 
                                  : 'Upload the official form PDF to auto-fill it with your details'}
                              </p>
                            </div>
                          </div>
              <input
                ref={fileInputRef}
                type="file"
                            accept=".pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadPDF(file);
                              }
                            }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfUploading}
                style={{
                              width: '100%',
                              padding: '10px 16px',
                              background: uploadedPdfUrl 
                                ? colors.success 
                                : pdfUploading 
                                  ? colors.gray[300] 
                                  : colors.primary,
                  color: 'white',
                  border: 'none',
                              borderRadius: '8px',
                  cursor: pdfUploading ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            {pdfUploading 
                              ? '⏳ Uploading...' 
                              : uploadedPdfUrl 
                                ? '✓ PDF Uploaded - Change File' 
                                : '📤 Upload PDF Form'}
              </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <Link
                            href={`/application-wizard?schemeId=${result.scheme.id}`}
                style={{
                              flex: 1,
                              padding: '12px 24px',
                              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  color: 'white',
                              textDecoration: 'none',
                  borderRadius: '10px',
                              textAlign: 'center',
                              fontWeight: '600',
                  fontSize: '16px',
                              boxShadow: `0 4px 12px ${colors.primary}40`
                            }}
                          >
                            🚀 Start Application Wizard
                          </Link>
                <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScheme(result);
                              handleFillPDF();
                            }}
                            disabled={loading || pdfUploading}
                  style={{
                              flex: 1,
                              padding: '12px 24px',
                              background: (loading || pdfUploading) ? colors.gray[300] : colors.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                              cursor: (loading || pdfUploading) ? 'not-allowed' : 'pointer',
                              fontSize: '16px',
                              fontWeight: '600',
                              boxShadow: (loading || pdfUploading) ? 'none' : `0 4px 12px ${colors.success}40`
                  }}
                >
                            {loading ? '⏳ Filling...' : pdfUploading ? '⏳ Uploading...' : '📄 Fill PDF Form'}
                </button>
              </div>
                      </div>
                    )}
              </div>
                ))}
            </div>

              <div style={{ marginTop: '24px' }}>
            <button
                  onClick={() => setStep('profile')}
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
                  ← Back to Profile
            </button>
          </div>
          </div>
        )}

          {/* Step 4: Complete */}
        {step === 'complete' && (
          <div>
            <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                  <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}dd 100%)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '40px',
                  boxShadow: `0 8px 24px ${colors.success}40`
                }}>
                  ✅
                </div>
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: colors.gray[900],
                  marginBottom: '8px'
                }}>
                  Application Ready!
                </h2>
                <p style={{
                  color: colors.gray[600],
                  fontSize: '16px'
                }}>
                  Your form has been filled and documents are ready
                </p>
                      </div>

              {filledPdfUrl && (
                <div style={{
                  background: colors.gray[50],
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: colors.gray[900]
                  }}>
                    📄 Filled Form
                  </h3>
                  <a
                    href={filledPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: colors.primary,
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      marginRight: '12px'
                    }}
                  >
                    👁️ View PDF
                  </a>
              </div>
            )}

              {selectedScheme?.scheme.official_portal_url && (
                <div style={{
                  background: colors.primary + '10',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: `1px solid ${colors.primary}30`
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: colors.primary
                  }}>
                    🌐 Official Portal
                  </h3>
                  <p style={{
                    margin: '0 0 16px 0',
                    color: colors.gray[700],
                    fontSize: '14px'
                  }}>
                    Submit your application on the official government portal
                  </p>
                  <a
                    href={selectedScheme.scheme.official_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      boxShadow: `0 4px 12px ${colors.primary}40`
                    }}
                  >
                    🚀 Go to Portal →
                  </a>
              </div>
            )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '24px'
              }}>
              <button
                onClick={handleDownloadKit}
                disabled={kitDownloading}
                style={{
                    padding: '16px 24px',
                    background: kitDownloading ? colors.gray[300] : colors.success,
                  color: 'white',
                  border: 'none',
                    borderRadius: '12px',
                  cursor: kitDownloading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: kitDownloading ? 'none' : `0 4px 12px ${colors.success}40`
                  }}
                >
                  {kitDownloading ? '⏳ Downloading...' : '📦 Download Application Kit'}
                </button>

                <button
                  onClick={handleSendKitWhatsapp}
                  disabled={sendingKitWhatsapp || kitDownloading}
                  style={{
                    padding: '16px 24px',
                    background: (sendingKitWhatsapp || kitDownloading) ? colors.gray[300] : '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: (sendingKitWhatsapp || kitDownloading) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: (sendingKitWhatsapp || kitDownloading) ? 'none' : '0 4px 12px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  {sendingKitWhatsapp ? '⏳ Sending...' : '📱 Send Kit to WhatsApp'}
              </button>

              {profile?.phone && (
                <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSendFormData(false);
                    }}
                    disabled={sendingWhatsapp || whatsappSent}
                  style={{
                      padding: '16px 24px',
                      background: (sendingWhatsapp || whatsappSent) ? colors.gray[300] : colors.primary,
                    color: 'white',
                    border: 'none',
                      borderRadius: '12px',
                      cursor: (sendingWhatsapp || whatsappSent) ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxShadow: (sendingWhatsapp || whatsappSent) ? 'none' : `0 4px 12px ${colors.primary}40`
                    }}
                  >
                    {sendingWhatsapp ? '⏳ Sending...' : whatsappSent ? '✅ Sent' : '📱 Send Form Data'}
                </button>
              )}
            </div>

              <div style={{
                textAlign: 'center',
                paddingTop: '24px',
                borderTop: `1px solid ${colors.gray[200]}`
              }}>
            <button
              onClick={() => {
                setStep('input');
                setText('');
                setProfile(null);
                setSchemes([]);
                setSelectedScheme(null);
                setFilledPdfUrl(null);
                setGeneratedDocs(null);
                    setWhatsappSent(false);
                    setEligibilityData(null);
              }}
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
              🏠 Start New Application
            </button>
              </div>
          </div>
        )}
        </div>
      </main>

      {/* Checklist Generator Modal */}
      {showChecklistGenerator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowChecklistGenerator(false);
          }
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowChecklistGenerator(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: colors.gray[500],
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray[100];
                e.currentTarget.style.color = colors.gray[900];
              }}
            >
              ×
            </button>

            {!checklistResult ? (
              <>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: colors.gray[900],
                  marginBottom: '8px'
                }}>
                  📋 Document Checklist Generator
                </h2>
                <p style={{
                  color: colors.gray[600],
                  marginBottom: '32px',
                  fontSize: '16px'
                }}>
                  Answer a few questions to get your personalized checklist
                </p>

                {/* Progress Indicator */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '32px'
                }}>
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        height: '4px',
                        background: checklistStep >= step ? colors.primary : colors.gray[200],
                        borderRadius: '2px',
                        transition: 'all 0.3s'
                      }}
                    />
                  ))}
                </div>

                {/* Questions */}
                {checklistStep === 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: colors.gray[900],
                      marginBottom: '16px'
                    }}>
                      What type of scheme are you applying for?
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {['Scholarship', 'Disability Benefits', 'Women Empowerment', 'Farmer Scheme', 'Senior Citizen', 'MSME/Business', 'Other'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setChecklistAnswers({ ...checklistAnswers, schemeType: type });
                            setChecklistStep(1);
                          }}
                          style={{
                            padding: '16px',
                            background: checklistAnswers.schemeType === type ? colors.primary + '10' : colors.gray[50],
                            border: `2px solid ${checklistAnswers.schemeType === type ? colors.primary : colors.gray[200]}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (checklistAnswers.schemeType !== type) {
                              e.currentTarget.style.borderColor = colors.primary;
                              e.currentTarget.style.background = colors.primary + '05';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (checklistAnswers.schemeType !== type) {
                              e.currentTarget.style.borderColor = colors.gray[200];
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {checklistStep === 1 && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: colors.gray[900],
                      marginBottom: '16px'
                    }}>
                      What is your category?
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {['General', 'SC', 'ST', 'OBC', 'EWS', 'Not Sure'].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setChecklistAnswers({ ...checklistAnswers, category });
                            setChecklistStep(2);
                          }}
                          style={{
                            padding: '16px',
                            background: checklistAnswers.category === category ? colors.primary + '10' : colors.gray[50],
                            border: `2px solid ${checklistAnswers.category === category ? colors.primary : colors.gray[200]}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (checklistAnswers.category !== category) {
                              e.currentTarget.style.borderColor = colors.primary;
                              e.currentTarget.style.background = colors.primary + '05';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (checklistAnswers.category !== category) {
                              e.currentTarget.style.borderColor = colors.gray[200];
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setChecklistStep(0)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                        background: colors.gray[200],
                        color: colors.gray[700],
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {checklistStep === 2 && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: colors.gray[900],
                      marginBottom: '16px'
                    }}>
                      Are you a student?
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {['Yes', 'No'].map((answer) => (
                        <button
                          key={answer}
                          onClick={() => {
                            setChecklistAnswers({ ...checklistAnswers, isStudent: answer === 'Yes' });
                            setChecklistStep(3);
                          }}
                          style={{
                            padding: '16px',
                            background: checklistAnswers.isStudent === (answer === 'Yes') ? colors.primary + '10' : colors.gray[50],
                            border: `2px solid ${checklistAnswers.isStudent === (answer === 'Yes') ? colors.primary : colors.gray[200]}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (checklistAnswers.isStudent !== (answer === 'Yes')) {
                              e.currentTarget.style.borderColor = colors.primary;
                              e.currentTarget.style.background = colors.primary + '05';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (checklistAnswers.isStudent !== (answer === 'Yes')) {
                              e.currentTarget.style.borderColor = colors.gray[200];
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                        >
                          {answer}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setChecklistStep(1)}
                      style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: colors.gray[200],
                        color: colors.gray[700],
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {checklistStep === 3 && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: colors.gray[900],
                      marginBottom: '16px'
                    }}>
                      What is your annual income?
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {['Less than ₹1 Lakh', '₹1-2.5 Lakhs', '₹2.5-5 Lakhs', '₹5-10 Lakhs', 'Above ₹10 Lakhs'].map((income) => (
                        <button
                          key={income}
                          onClick={async () => {
                            const finalAnswers = { ...checklistAnswers, income };
                            setChecklistAnswers(finalAnswers);
                            setGeneratingChecklist(true);
                            
                            try {
                              const res = await fetch('/api/generate-checklist', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  schemeType: finalAnswers.schemeType,
                                  category: finalAnswers.category,
                                  isStudent: finalAnswers.isStudent,
                                  income: finalAnswers.income
                                })
                              });
                              
                              if (res.ok) {
                                const data = await res.json();
                                setChecklistResult(data.checklist);
                              } else {
                                throw new Error('Failed to generate');
                              }
                            } catch (err) {
                              // Fallback checklist
                              const docs: string[] = [];
                              docs.push('☐ Aadhar Card');
                              docs.push('☐ PAN Card (if applicable)');
                              docs.push('☐ Bank Passbook/Cancelled Cheque');
                              docs.push('☐ Passport Size Photographs (2-4 copies)');
                              
                              if (finalAnswers.category && finalAnswers.category !== 'General' && finalAnswers.category !== 'Not Sure') {
                                docs.push(`☐ ${finalAnswers.category} Category Certificate`);
                              }
                              
                              if (finalAnswers.income && !finalAnswers.income.includes('Above ₹10')) {
                                docs.push('☐ Income Certificate');
                              }
                              
                              if (finalAnswers.schemeType === 'Scholarship' || finalAnswers.isStudent) {
                                docs.push('☐ Educational Certificates');
                                docs.push('☐ Marksheets');
                              }

                              setChecklistResult(`📋 PERSONALIZED DOCUMENT CHECKLIST

Generated on: ${new Date().toLocaleDateString('en-IN')}

Scheme Type: ${finalAnswers.schemeType || 'Not specified'}
Category: ${finalAnswers.category || 'Not specified'}
Student: ${finalAnswers.isStudent ? 'Yes' : 'No'}
Income: ${finalAnswers.income || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIRED DOCUMENTS:

${docs.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 NOTES:
• All documents should be self-attested copies
• Keep original documents ready for verification
• Ensure all documents are recent (not older than 6 months)

Generated by YojanaMitra`);
                            } finally {
                              setGeneratingChecklist(false);
                            }
                          }}
                          style={{
                            padding: '16px',
                            background: checklistAnswers.income === income ? colors.primary + '10' : colors.gray[50],
                            border: `2px solid ${checklistAnswers.income === income ? colors.primary : colors.gray[200]}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (checklistAnswers.income !== income) {
                              e.currentTarget.style.borderColor = colors.primary;
                              e.currentTarget.style.background = colors.primary + '05';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (checklistAnswers.income !== income) {
                              e.currentTarget.style.borderColor = colors.gray[200];
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                        >
                          {income}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setChecklistStep(2)}
                      style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: colors.gray[200],
                        color: colors.gray[700],
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {generatingChecklist && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px'
                    }}>
                      ⏳
                    </div>
                    <p style={{
                      color: colors.gray[600],
                      fontSize: '16px'
                    }}>
                      Generating your personalized checklist...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: colors.gray[900],
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '32px' }}>✅</span>
                  Your Personalized Checklist
                </h2>
                <div style={{
                  background: colors.gray[50],
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: colors.gray[800],
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {checklistResult}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const blob = new Blob([checklistResult], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'document-checklist.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: colors.primary,
                color: 'white',
                border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    📥 Download Checklist
                  </button>
                  <button
                    onClick={() => {
                      setShowChecklistGenerator(false);
                      setChecklistStep(0);
                      setChecklistAnswers({});
                      setChecklistResult(null);
                    }}
                    style={{
                      padding: '14px 24px',
                      background: colors.gray[200],
                      color: colors.gray[700],
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Close
            </button>
                </div>
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}
