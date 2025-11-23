// pages/api/validate-document.ts
// OCR validation for documents (DOB format, name match, etc.)
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openaiKey = process.env.OPENAI_API_KEY
const client = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { docType, docUrl, profile } = req.body

  if (!docType || !docUrl) {
    return res.status(400).json({ error: 'Document type and URL are required' })
  }

  try {
    const errors: Array<{ field: string; message: string }> = []

    // Load document
    const docPath = path.join(process.cwd(), 'public', docUrl.replace(/^\//, ''))
    if (!fs.existsSync(docPath)) {
      return res.status(404).json({ error: 'Document not found' })
    }

    const docBytes = fs.readFileSync(docPath)

    if (!client) {
      return res.status(200).json({
        validated: true,
        errors: [],
        message: 'OCR validation skipped (OpenAI not configured)'
      })
    }

    // Use GPT-Vision to extract and validate document data
    const base64Doc = docBytes.toString('base64')
    const mimeType = docPath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'

    const prompt = `Analyze this ${docType} document and validate:

1. Extract key information: Name, Date of Birth, Document Number, etc.
2. Check if extracted name matches: "${profile?.name || 'Not provided'}"
3. Validate Date of Birth format (should be DD/MM/YYYY or DD-MM-YYYY)
4. Check document authenticity indicators (signatures, stamps, etc.)
5. Verify document is clear and readable

Return JSON with:
- "extractedData": object with extracted fields
- "nameMatch": boolean (does name match profile?)
- "dobFormat": string (format found or "invalid")
- "isValid": boolean
- "errors": array of validation errors
- "warnings": array of warnings

Return ONLY valid JSON.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Doc}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content || '{}'
    const validation = JSON.parse(content)

    if (!validation.isValid) {
      errors.push({
        field: docType,
        message: validation.errors?.join(', ') || 'Document validation failed'
      })
    }

    if (!validation.nameMatch && profile?.name) {
      errors.push({
        field: docType,
        message: 'Name on document does not match profile name'
      })
    }

    return res.status(200).json({
      validated: validation.isValid,
      extractedData: validation.extractedData || {},
      nameMatch: validation.nameMatch,
      errors,
      warnings: validation.warnings || []
    })

  } catch (err: any) {
    console.error('[validate-document] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to validate document',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



