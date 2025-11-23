// pages/api/generate-form-data.ts
// Generates structured form data for easy portal filling
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openaiKey = process.env.OPENAI_API_KEY
const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null

interface Profile {
  name?: string
  age?: number
  phone?: string
  state?: string
  income_annual?: number
  caste?: string
  education?: string
  address?: string
  aadhar?: string
  bank_account?: string
  ifsc?: string
  [key: string]: any
}

interface Scheme {
  id: string
  title: string
  official_portal_url?: string
  application_url?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, scheme } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'Profile is required' })
  }

  try {
    // Create structured form data mapping for common government portal fields
    const formDataMapping: Record<string, any> = {
      // Personal Information
      'Full Name': profile.name || '',
      'Name': profile.name || '',
      'Applicant Name': profile.name || '',
      'First Name': profile.name?.split(' ')[0] || '',
      'Last Name': profile.name?.split(' ').slice(1).join(' ') || '',
      
      // Age/DOB
      'Age': profile.age ? String(profile.age) : '',
      'Date of Birth': profile.dob || (profile.age ? calculateDOB(profile.age) : ''),
      
      // Contact
      'Phone Number': profile.phone || '',
      'Mobile Number': profile.phone || '',
      'Contact Number': profile.phone || '',
      'WhatsApp Number': profile.phone || '',
      
      // Location
      'State': profile.state || '',
      'District': profile.district || '',
      'Address': profile.address || `${profile.state || ''}`,
      'Pincode': profile.pincode || '',
      
      // Financial
      'Annual Income': profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : '',
      'Family Income': profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : '',
      'Income': profile.income_annual ? String(profile.income_annual) : '',
      
      // Category
      'Category': profile.caste || '',
      'Caste': profile.caste || '',
      'Social Category': profile.caste || '',
      'Reservation Category': profile.caste || '',
      
      // Education
      'Education': profile.education || '',
      'Qualification': profile.education || '',
      'Education Level': profile.education || '',
      'Highest Qualification': profile.education || '',
      
      // Documents
      'Aadhar Number': profile.aadhar || '',
      'Aadhaar Number': profile.aadhar || '',
      'Bank Account Number': profile.bank_account || '',
      'IFSC Code': profile.ifsc || '',
      'Bank Name': profile.bank_name || '',
    }

    // Use AI to generate portal-specific field mappings if OpenAI is available
    let portalSpecificMapping: Record<string, string> = {}
    if (openaiClient && scheme) {
      try {
        const prompt = `Given this government scheme portal form, map the user profile data to common form field names that might appear on the portal.

User Profile:
- Name: ${profile.name || 'Not provided'}
- Age: ${profile.age || 'Not provided'}
- Phone: ${profile.phone || 'Not provided'}
- State: ${profile.state || 'Not provided'}
- Annual Income: ${profile.income_annual || 'Not provided'}
- Category/Caste: ${profile.caste || 'Not provided'}
- Education: ${profile.education || 'Not provided'}

Scheme: ${scheme.title || 'Government Scheme'}
Portal: ${scheme.official_portal_url || scheme.application_url || 'Not specified'}

Return a JSON object mapping common portal field names to the user's data. Include variations like:
- "Full Name", "Applicant Name", "Name" -> user's name
- "Phone", "Mobile", "Contact Number" -> user's phone
- "State", "State Name" -> user's state
- "Annual Income", "Family Income", "Income" -> user's income
- "Category", "Caste", "Social Category" -> user's caste
- "Education", "Qualification" -> user's education

Return ONLY valid JSON, no other text. Format: {"Field Name": "value", ...}`

        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that maps user data to government portal form fields. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.3
        })

        const content = response.choices[0]?.message?.content || '{}'
        portalSpecificMapping = JSON.parse(content)
      } catch (err: any) {
        console.warn('[generate-form-data] AI mapping failed, using defaults:', err.message)
      }
    }

    // Merge mappings
    const finalMapping = { ...formDataMapping, ...portalSpecificMapping }

    // Create structured format for easy copy-paste
    const structuredData = {
      personal: {
        name: profile.name || '',
        age: profile.age || '',
        phone: profile.phone || '',
        state: profile.state || '',
        address: profile.address || ''
      },
      financial: {
        annualIncome: profile.income_annual || '',
        incomeFormatted: profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : ''
      },
      category: {
        caste: profile.caste || '',
        category: profile.caste || ''
      },
      education: {
        qualification: profile.education || '',
        educationLevel: profile.education || ''
      },
      documents: {
        aadhar: profile.aadhar || '',
        bankAccount: profile.bank_account || '',
        ifsc: profile.ifsc || ''
      },
      fieldMapping: finalMapping
    }

    return res.status(200).json({
      success: true,
      structuredData,
      fieldMapping: finalMapping,
      copyPasteFormat: generateCopyPasteFormat(finalMapping),
      instructions: generateInstructions(scheme, profile)
    })
  } catch (err: any) {
    console.error('[generate-form-data] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to generate form data',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

function calculateDOB(age: number): string {
  const today = new Date()
  const birthYear = today.getFullYear() - age
  return `01/01/${birthYear}` // Approximate DOB
}

function generateCopyPasteFormat(mapping: Record<string, any>): string {
  const lines: string[] = []
  lines.push('📋 FORM DATA (Copy-Paste Ready):')
  lines.push('')
  
  Object.entries(mapping).forEach(([field, value]) => {
    if (value && value !== '') {
      lines.push(`${field}: ${value}`)
    }
  })
  
  return lines.join('\n')
}

function generateInstructions(scheme: any, profile: any): string {
  const portalUrl = scheme?.official_portal_url || scheme?.application_url || 'the official portal'
  
  return `1. Open ${portalUrl}
2. Click "New Registration" or "Apply Now"
3. Copy the field values from the form data below
4. Paste into corresponding fields on the portal
5. Review all fields before submitting
6. Upload required documents
7. Submit the application`
}

