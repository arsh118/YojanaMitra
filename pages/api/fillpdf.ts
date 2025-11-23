// pages/api/fillpdf.ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'

// Simple UUID fallback if uuid package fails
function generateId(): string {
  try {
    return uuidv4()
  } catch {
    return `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

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
  documents?: string[]
  [key: string]: any
}

async function extractPdfFieldsWithVision(pdfBytes: Buffer): Promise<{ fields: string[], mapping: any, fieldDescriptions: any }> {
  if (!openaiClient) {
    console.warn('[fillpdf] OpenAI not available, skipping vision extraction')
    return { fields: [], mapping: {}, fieldDescriptions: {} }
  }

  try {
    // Convert PDF to base64 for vision API
    const base64Pdf = pdfBytes.toString('base64')
    
    // Use GPT-4 Vision to analyze the PDF and extract form fields
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this official government scholarship/benefit form PDF. Extract ALL fillable form field names and their labels/descriptions.

Return a JSON object with:
1. "fields": array of all field names found (exact field names as they appear in the PDF)
2. "mapping": object mapping common profile fields to PDF field names (e.g., {"name": "applicant_name", "income_annual": "annual_income"})
3. "fieldDescriptions": object with field names as keys and their labels/descriptions as values

Focus on fields like:
- Name/Applicant Name
- Age/Date of Birth
- Phone/Mobile
- State/District
- Income/Annual Income
- Caste/Category
- Education/Qualification
- Address
- Bank details
- Aadhar number
- Any other relevant fields

Return ONLY valid JSON, no other text.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    
    return {
      fields: parsed.fields || [],
      mapping: parsed.mapping || {},
      fieldDescriptions: parsed.fieldDescriptions || {}
    }
  } catch (err: any) {
    console.error('[fillpdf] Vision extraction error:', err)
    return { fields: [], mapping: {}, fieldDescriptions: {} }
  }
}

async function extractPdfFields(pdfDoc: PDFDocument, pdfBytes?: Buffer): Promise<{ fields: string[], mapping: any, fieldDescriptions: any }> {
  try {
    // First, try to extract fields using GPT-Vision if PDF bytes are provided
    if (pdfBytes && openaiClient) {
      console.log('[fillpdf] Using GPT-Vision to extract fields from official form...')
      const visionResult = await extractPdfFieldsWithVision(pdfBytes)
      if (visionResult.fields.length > 0) {
        console.log('[fillpdf] Vision extracted fields:', visionResult.fields)
        return visionResult
      }
    }

    // Fallback to PDF-lib form extraction
    let form
    try {
      form = pdfDoc.getForm()
    } catch (err: any) {
      console.warn('[fillpdf] PDF does not have a form')
      return {
        fields: [],
        mapping: {},
        fieldDescriptions: {}
      }
    }
    
    const fields: string[] = []
    
    // Get all field names from the PDF form
    const formFields = form.getFields()
    if (formFields.length === 0) {
      console.warn('[fillpdf] PDF form has no fields')
      return {
        fields: [],
        mapping: {},
        fieldDescriptions: {}
      }
    }
    
    const fieldNames = formFields.map(field => {
      const name = field.getName()
      fields.push(name)
      return name
    })

    // Create intelligent mapping based on field names
    const mapping: any = {}
    const fieldDescriptions: any = {}
    
    fieldNames.forEach(fieldName => {
      const lower = fieldName.toLowerCase()
      fieldDescriptions[fieldName] = fieldName // Use field name as description
      
      if (lower.includes('name') || lower.includes('applicant')) {
        mapping.name = fieldName
        mapping.applicant_name = fieldName
      }
      if (lower.includes('age') || lower.includes('dob') || lower.includes('date')) {
        mapping.age = fieldName
      }
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
        mapping.phone = fieldName
      }
      if (lower.includes('state') || lower.includes('district')) {
        mapping.state = fieldName
      }
      if (lower.includes('income') || lower.includes('salary')) {
        mapping.income_annual = fieldName
        mapping.income = fieldName
      }
      if (lower.includes('caste') || lower.includes('category')) {
        mapping.caste = fieldName
      }
      if (lower.includes('education') || lower.includes('qualification')) {
        mapping.education = fieldName
      }
      if (lower.includes('address')) {
        mapping.address = fieldName
      }
    })

    return { fields: fieldNames, mapping, fieldDescriptions }
  } catch (err: any) {
    console.error('[fillpdf] Error extracting fields:', err)
    // Fallback to common fields
    return {
      fields: ['applicant_name', 'age', 'state', 'income', 'phone', 'caste', 'education'],
      mapping: {
        name: 'applicant_name',
        age: 'age',
        state: 'state',
        income_annual: 'income',
        phone: 'phone',
        caste: 'caste',
        education: 'education'
      },
      fieldDescriptions: {}
    }
  }
}

function mapProfileToFields(profile: Profile, mapping: any): Record<string, string> {
  const fieldValues: Record<string, string> = {}
  
  // Standard mappings
  const standardMappings = {
    name: profile.name || '',
    age: String(profile.age || ''),
    phone: profile.phone || '',
    state: profile.state || '',
    income: String(profile.income_annual || ''),
    income_annual: String(profile.income_annual || ''),
    caste: profile.caste || '',
    education: profile.education || '',
    applicant_name: profile.name || '',
    ...mapping
  }

  // Apply custom mapping if provided
  Object.keys(mapping).forEach(key => {
    const pdfFieldName = mapping[key]
    if (profile[key as keyof Profile]) {
      fieldValues[pdfFieldName] = String(profile[key as keyof Profile] || '')
    }
  })

  // Also add standard mappings
  Object.keys(standardMappings).forEach(key => {
    if (standardMappings[key as keyof typeof standardMappings]) {
      fieldValues[key] = String(standardMappings[key as keyof typeof standardMappings])
    }
  })

  return fieldValues
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, schemeId, pdfUrl } = req.body
  if (!profile) return res.status(400).json({ error: 'profile required' })

  try {
    // Determine PDF path
    let templatePath: string
    if (pdfUrl) {
      templatePath = path.join(process.cwd(), 'public', pdfUrl.replace(/^\//, ''))
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: 'PDF template not found' })
      }
    } else {
      templatePath = path.join(process.cwd(), 'public', 'sample-form.pdf')
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ error: 'Default PDF template not found. Please upload a PDF.' })
      }
    }

    // Load PDF
    console.log('[fillpdf] Loading PDF from:', templatePath)
    const existingPdfBytes = fs.readFileSync(templatePath)
    let pdfDoc: PDFDocument
    try {
      pdfDoc = await PDFDocument.load(existingPdfBytes)
    } catch (loadErr: any) {
      console.error('[fillpdf] Failed to load PDF:', loadErr)
      return res.status(500).json({ 
        error: 'Failed to load PDF file. The file may be corrupted or not a valid PDF.',
        details: loadErr.message
      })
    }
    
    // Extract fields from PDF form (using Vision if available)
    console.log('[fillpdf] Extracting fields from PDF form...')
    const { fields, mapping, fieldDescriptions } = await extractPdfFields(pdfDoc, existingPdfBytes)
    console.log('[fillpdf] Extracted fields:', fields)
    console.log('[fillpdf] Field mapping:', mapping)
    console.log('[fillpdf] Field descriptions:', fieldDescriptions)

    // Get form (handle case where PDF doesn't have a form)
    let form
    let hasForm = false
    try {
      form = pdfDoc.getForm()
      hasForm = true
    } catch (formErr: any) {
      console.warn('[fillpdf] PDF does not have fillable form fields, will create new PDF with data')
      hasForm = false
    }
    
    // If no form, create a new PDF with the profile data
    if (!hasForm || fields.length === 0) {
      console.log('[fillpdf] Creating new PDF with profile data')
      try {
        const newPdfDoc = await PDFDocument.create()
        const page = newPdfDoc.addPage([600, 800])
        const font = await newPdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        let yPos = 750
        page.drawText('Government Scheme Application Form', { 
          x: 50, 
          y: yPos, 
          size: 18, 
          font: boldFont 
        })
        
        yPos -= 40
        const formData = [
          { label: 'Applicant Name', value: profile.name || 'Not provided' },
          { label: 'Age', value: profile.age ? String(profile.age) : 'Not provided' },
          { label: 'Phone', value: profile.phone || 'Not provided' },
          { label: 'State', value: profile.state || 'Not provided' },
          { label: 'Annual Income (INR)', value: profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided' },
          { label: 'Caste/Category', value: profile.caste || 'Not provided' },
          { label: 'Education', value: profile.education || 'Not provided' }
        ]
        
        formData.forEach(({ label, value }) => {
          page.drawText(`${label}:`, { x: 50, y: yPos, size: 12, font: boldFont })
          page.drawText(value, { x: 250, y: yPos, size: 12, font })
          yPos -= 30
        })
        
        page.drawText('Generated by YojanaMitra', { 
          x: 50, 
          y: yPos - 20, 
          size: 10, 
          font,
          color: rgb(0.5, 0.5, 0.5)
        })
        
        const newPdfBytes = await newPdfDoc.save()
        const fileId = generateId()
        const outPath = path.join(process.cwd(), 'public', `filled-${fileId}.pdf`)
        
        const publicDir = path.join(process.cwd(), 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        
        fs.writeFileSync(outPath, Buffer.from(newPdfBytes))
        
        return res.status(200).json({
          url: `/filled-${fileId}.pdf`,
          filledFields: formData.map(f => f.label),
          failedFields: [],
          totalFields: 0,
          confidence: 1.0,
          message: 'Created new PDF with your profile information since the template had no fillable fields.'
        })
      } catch (createErr: any) {
        console.error('[fillpdf] Error creating new PDF:', createErr)
        return res.status(500).json({ 
          error: 'Failed to create PDF with profile data',
          details: createErr.message
        })
      }
    }

    // Map profile data to PDF fields
    const fieldValues = mapProfileToFields(profile, mapping)

    // Fill all available fields (preserve existing values if they exist, only update with profile data)
    const filledFields: string[] = []
    const failedFields: string[] = []
    const preservedFields: string[] = []

    if (fields.length === 0) {
      console.warn('[fillpdf] No form fields found in PDF')
      // Even if no fields, we can still save the PDF (it will be unchanged but at least processed)
      // Or we could create a new PDF with text annotations
    } else {
      for (const fieldName of fields) {
        try {
          const field = form.getTextField(fieldName)
          const existingValue = field.getText() || ''
          const newValue = fieldValues[fieldName] || fieldValues[mapping[fieldName]] || ''
          
          // Only fill if field is empty OR if we have a value to update with
          if (newValue) {
            // If field already has a value, preserve it unless we're explicitly updating
            if (existingValue && existingValue.trim() !== '') {
              // Check if the existing value is different - if so, update it with profile data
              if (existingValue !== newValue) {
                field.setText(newValue)
                filledFields.push(fieldName)
                console.log(`[fillpdf] Updated field "${fieldName}" from "${existingValue}" to "${newValue}"`)
              } else {
                preservedFields.push(fieldName)
                console.log(`[fillpdf] Preserved existing value in field "${fieldName}": "${existingValue}"`)
              }
            } else {
              // Field is empty, fill it
              field.setText(newValue)
              filledFields.push(fieldName)
              console.log(`[fillpdf] Filled empty field "${fieldName}" with value: ${newValue}`)
            }
          } else if (existingValue && existingValue.trim() !== '') {
            // Field has existing value but no new value to set - preserve it
            preservedFields.push(fieldName)
            console.log(`[fillpdf] Preserved existing value in field "${fieldName}": "${existingValue}"`)
          }
        } catch (err: any) {
          // Field might not exist or might be a different type
          try {
            const field = form.getDropdown(fieldName)
            const existingValue = field.getSelected() || ''
            const newValue = fieldValues[fieldName] || fieldValues[mapping[fieldName]] || ''
            
            if (newValue) {
              if (existingValue && existingValue !== newValue) {
                field.select(newValue)
                filledFields.push(fieldName)
                console.log(`[fillpdf] Updated dropdown "${fieldName}" to "${newValue}"`)
              } else if (!existingValue) {
                field.select(newValue)
                filledFields.push(fieldName)
                console.log(`[fillpdf] Selected dropdown "${fieldName}" with value: ${newValue}`)
              } else {
                preservedFields.push(fieldName)
              }
            } else if (existingValue) {
              preservedFields.push(fieldName)
            }
          } catch (err2: any) {
            console.warn(`[fillpdf] Could not fill field "${fieldName}":`, err2.message)
            failedFields.push(fieldName)
          }
        }
      }
    }

    // Also try common field names as fallback (only if we have a form)
    if (form && fields.length > 0) {
      const commonFields = [
        { pdf: 'applicant_name', profile: 'name' },
        { pdf: 'name', profile: 'name' },
        { pdf: 'age', profile: 'age' },
        { pdf: 'phone', profile: 'phone' },
        { pdf: 'state', profile: 'state' },
        { pdf: 'income', profile: 'income_annual' },
        { pdf: 'annual_income', profile: 'income_annual' },
        { pdf: 'caste', profile: 'caste' },
        { pdf: 'category', profile: 'caste' },
        { pdf: 'education', profile: 'education' }
      ]

      for (const { pdf, profile: profileKey } of commonFields) {
        if (!filledFields.includes(pdf) && profile[profileKey as keyof Profile]) {
          try {
            const field = form.getTextField(pdf)
            field.setText(String(profile[profileKey as keyof Profile] || ''))
            filledFields.push(pdf)
            console.log(`[fillpdf] Filled common field "${pdf}" with value from profile`)
          } catch (err: any) {
            // Field doesn't exist, skip
          }
        }
      }
    }

    // Save filled PDF
    try {
      const filledPdfBytes = await pdfDoc.save()
      const fileId = generateId()
      const outPath = path.join(process.cwd(), 'public', `filled-${fileId}.pdf`)
      
      // Ensure public directory exists
      const publicDir = path.join(process.cwd(), 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
      
      fs.writeFileSync(outPath, Buffer.from(filledPdfBytes))
      
      console.log('[fillpdf] Successfully filled PDF:', {
        filledFields,
        failedFields,
        outputPath: outPath,
        totalFields: fields.length
      })

      // Determine which fields still need manual input
      const remainingFields = fields.filter(field => 
        !filledFields.includes(field) && !failedFields.includes(field) && !preservedFields.includes(field)
      )

      // Even if no fields were filled, return success (PDF was processed)
      return res.status(200).json({
        url: `/filled-${fileId}.pdf`,
        filledFields,
        preservedFields,
        failedFields,
        remainingFields,
        totalFields: fields.length,
        fieldDescriptions,
        confidence: fields.length > 0 
          ? (filledFields.length + preservedFields.length) / (filledFields.length + preservedFields.length + failedFields.length + remainingFields.length) 
          : 0,
        message: fields.length === 0 
          ? 'PDF processed but no fillable form fields found. The original PDF has been saved.'
          : `Successfully processed ${fields.length} fields: ${filledFields.length} auto-filled, ${preservedFields.length} preserved from your upload, ${remainingFields.length} need manual input.`,
        instructions: remainingFields.length > 0 
          ? `Please review the PDF and fill the remaining fields: ${remainingFields.slice(0, 5).join(', ')}${remainingFields.length > 5 ? '...' : ''}`
          : 'All fields have been filled! Your existing filled fields were preserved and new ones were added.'
      })
    } catch (saveErr: any) {
      console.error('[fillpdf] Error saving PDF:', saveErr)
      return res.status(500).json({ 
        error: 'Failed to save filled PDF',
        details: saveErr.message
      })
    }
  } catch (e: any) {
    console.error('[fillpdf] Error:', e)
    console.error('[fillpdf] Error stack:', e.stack)
    return res.status(500).json({ 
      error: e.message || 'Failed to fill PDF',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    })
  }
}
