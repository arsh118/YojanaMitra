// pages/api/send-form-data.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/twilioSend'

interface Profile {
  name?: string
  age?: number
  phone?: string
  state?: string
  income_annual?: number
  caste?: string
  education?: string
  [key: string]: any
}

interface Scheme {
  id: string
  title: string
  official_portal_url?: string
  application_url?: string
  source_url?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, scheme, filledFields, portalUrl } = req.body

  if (!profile || !profile.phone) {
    return res.status(400).json({ 
      error: 'Profile and phone number are required'
    })
  }

  if (!scheme) {
    return res.status(400).json({ 
      error: 'Scheme information is required'
    })
  }

  try {
    const phoneNumber = profile.phone.replace(/\D/g, '')
    if (phoneNumber.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Please provide a valid 10-digit phone number.'
      })
    }

    const escapeWhatsApp = (text: string) => text.replace(/[*_~`]/g, '')
    
    // Get portal URL
    const officialUrl = portalUrl || scheme.official_portal_url || scheme.application_url || scheme.source_url || 'Not available'
    
    // Generate structured form data mapping for easy copy-paste
    const formDataMapping: Record<string, string> = {
      'Full Name': profile.name || '',
      'Name': profile.name || '',
      'Applicant Name': profile.name || '',
      'Phone Number': profile.phone || '',
      'Mobile Number': profile.phone || '',
      'Contact Number': profile.phone || '',
      'State': profile.state || '',
      'Annual Income': profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : '',
      'Income': profile.income_annual ? String(profile.income_annual) : '',
      'Category': profile.caste || '',
      'Caste': profile.caste || '',
      'Education': profile.education || '',
      'Qualification': profile.education || '',
      'Age': profile.age ? String(profile.age) : '',
    }
    
    // Create copy-paste ready format
    const copyPasteLines: string[] = []
    Object.entries(formDataMapping).forEach(([field, value]) => {
      if (value && value !== '') {
        copyPasteLines.push(`${field}: ${value}`)
      }
    })
    
    const structuredFormData = copyPasteLines.length > 0 
      ? `\n\n📋 *COPY-PASTE READY FORM DATA:*\n\`\`\`\n${copyPasteLines.join('\n')}\n\`\`\`\n\n💡 *How to Use:*\n1. Open portal: ${officialUrl}\n2. Copy-paste these values into form fields\n3. Review and submit`
      : ''

    // Build comprehensive form data message
    const profileDetails = `📋 *Your Details (For Form Filling):*
• *Name:* ${escapeWhatsApp(profile.name || 'Not provided')}
• *Age:* ${profile.age || 'Not provided'} years
• *Phone:* ${profile.phone || 'Not provided'}
• *State:* ${escapeWhatsApp(profile.state || 'Not provided')}
• *Annual Income:* ${profile.income_annual ? `Rs ${profile.income_annual.toLocaleString()}` : 'Not provided'}
• *Category:* ${escapeWhatsApp(profile.caste || 'Not provided')}
• *Education:* ${escapeWhatsApp(profile.education || 'Not provided')}`

    // Build form filling instructions
    let formInstructions = ''
    if (filledFields && filledFields.length > 0) {
      formInstructions = `\n✅ *Auto-filled Fields (${filledFields.length}):*
${filledFields.slice(0, 10).map((field: string) => `• ${escapeWhatsApp(field)}`).join('\n')}
${filledFields.length > 10 ? `\n... aur ${filledFields.length - 10} fields` : ''}`
    }

    // Build portal access instructions
    const portalInstructions = `\n🌐 *Official Portal Access:*
• *Portal URL:* ${officialUrl}
• *Application Link:* ${scheme.application_url || officialUrl}

📝 *Next Steps:*
1. Go to portal: ${officialUrl}
2. Click "New Registration" or "Apply Now" button
3. Fill the form with the details below:
${profileDetails}
${formInstructions}

💡 *Tips:*
• Fill all details carefully
• Keep required documents ready
• Review once before submitting the form
• Take a screenshot for reference

⚠️ *Important:*
• Submit before the deadline
• Note down your application number
• Check confirmation email/SMS

Thank you! 🙏
*YojanaMitra Team*`

    const message = `Hello ${escapeWhatsApp(profile.name || 'User')}! 👋

Your form data for *${escapeWhatsApp(scheme.title || 'Government Scheme')}* is ready!

${profileDetails}
${structuredFormData}
${formInstructions}
${portalInstructions}

🔄 *Quick Fill Tips:*
• You can use browser autofill
• Save the form data for future use
• Check each field carefully`

    // Send via WhatsApp
    const formattedTo = `whatsapp:+91${phoneNumber}`
    console.log('[send-form-data] Sending form data to:', formattedTo)
    
    const result = await sendMessage(formattedTo, message)
    
    if (!result.success) {
      console.error('[send-form-data] Failed:', result.error)
      return res.status(500).json({ 
        error: result.error || 'Failed to send form data',
        hint: 'Please check Twilio configuration'
      })
    }
    
    console.log('[send-form-data] Success:', result.sid)
    return res.status(200).json({ 
      ok: true, 
      sid: result.sid,
      message: 'Form data sent successfully via WhatsApp',
      portalUrl: officialUrl
    })
  } catch (err: any) {
    console.error('[send-form-data] Error:', err)
    return res.status(500).json({ 
      error: err.message || 'Failed to send form data',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

