// pages/api/parse-pdf-fields.ts
// Parse PDF form fields using GPT-Vision
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openaiKey = process.env.OPENAI_API_KEY
const client = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { pdfUrl } = req.body

  if (!pdfUrl) {
    return res.status(400).json({ error: 'PDF URL is required' })
  }

  if (!client) {
    return res.status(500).json({ error: 'OpenAI not configured' })
  }

  try {
    // Load PDF file
    const pdfPath = path.join(process.cwd(), 'public', pdfUrl.replace(/^\//, ''))
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const pdfBytes = fs.readFileSync(pdfPath)
    const base64Pdf = pdfBytes.toString('base64')

    const prompt = `Analyze this PDF form and extract all form fields. For each field, identify:
1. Field name/label
2. Field type (text, number, date, checkbox, radio, dropdown, etc.)
3. Field position (approximate coordinates if visible)
4. Whether it's required or optional
5. Any placeholder text or example values

Return a JSON array of fields with this structure:
[
  {
    "name": "field_name",
    "type": "text|number|date|select|checkbox|radio",
    "label": "Field Label",
    "required": true|false,
    "position": { "x": 0, "y": 0, "width": 100, "height": 20 },
    "placeholder": "example value if any"
  }
]

Return ONLY valid JSON array, no other text.`

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
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content || '[]'
    const fields = JSON.parse(content)

    return res.status(200).json({
      success: true,
      fields: Array.isArray(fields) ? fields : [],
      count: Array.isArray(fields) ? fields.length : 0
    })

  } catch (err: any) {
    console.error('[parse-pdf-fields] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to parse PDF fields',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



