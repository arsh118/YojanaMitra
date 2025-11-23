// pages/api/generate-docs.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Profile {
  name?: string
  age?: number
  phone?: string
  state?: string
  income_annual?: number
  caste?: string
  education?: string
  address?: string
  [key: string]: any
}

interface Scheme {
  id: string
  title: string
  description: string
  required_docs: string[]
  [key: string]: any
}

async function generateDocument(type: 'letter' | 'affidavit' | 'checklist', profile: Profile, scheme: Scheme): Promise<string> {
  const date = new Date().toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  let prompt = ''

  if (type === 'letter') {
    prompt = `Create a formal application support letter in both English and Hindi (Hinglish format) for ${profile.name || 'the applicant'} applying for ${scheme.title}.

User Details:
- Name: ${profile.name || 'Not provided'}
- Age: ${profile.age || 'Not provided'}
- State: ${profile.state || 'Not provided'}
- Annual Income: ${profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided'}
- Education: ${profile.education || 'Not provided'}
- Caste: ${profile.caste || 'Not provided'}

The letter should:
1. Be formal and respectful
2. Clearly state the applicant's eligibility
3. Request consideration for the scheme
4. Include date: ${date}
5. Be in Hinglish (mix of Hindi and English) for accessibility
6. Be concise (200-250 words)

Format as a proper letter with proper salutation and closing.`
  } else if (type === 'affidavit') {
    prompt = `Create a formal affidavit in both English and Hindi (Hinglish format) for ${profile.name || 'the applicant'} regarding their application for ${scheme.title}.

User Details:
- Name: ${profile.name || 'Not provided'}
- Age: ${profile.age || 'Not provided'}
- State: ${profile.state || 'Not provided'}
- Annual Income: ${profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided'}
- Address: ${profile.address || 'Not provided'}

The affidavit should:
1. Be in proper legal format
2. Include a declaration about the information provided
3. State that all information is true and correct
4. Include date: ${date}
5. Include space for signature and witness
6. Be in Hinglish (mix of Hindi and English) for accessibility
7. Be concise (150-200 words)

Format as a proper legal affidavit.`
  } else {
    // Checklist
    prompt = `Create a personalized document checklist for ${profile.name || 'the applicant'} applying for ${scheme.title}.

Required Documents: ${scheme.required_docs.join(', ')}

The checklist should:
1. List all required documents clearly
2. Include checkboxes (☐) for each item
3. Be in both English and Hindi (Hinglish)
4. Include helpful notes about where to obtain each document
5. Be organized and easy to follow
6. Include a section for "Documents Already Available" based on: ${profile.documents?.join(', ') || 'None listed'}

Format as a clear, actionable checklist.`
  }

  try {
    const reply = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates formal documents for government scheme applications. Always use Hinglish (mix of Hindi and English) to make documents accessible to users with low literacy.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7
    })
    return reply.choices?.[0]?.message?.content || ''
  } catch (err: any) {
    console.error(`[generate-docs] Error generating ${type}:`, err)
    throw err
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, scheme, docTypes } = req.body
  if (!profile || !scheme) return res.status(400).json({ error: 'profile and scheme required' })

  // Default to generating all document types if not specified
  const typesToGenerate = docTypes || ['letter', 'affidavit', 'checklist']

  try {
    const documents: Record<string, { url: string; content: string; type: string }> = {}
    const id = uuidv4()

    // Generate each requested document type
    for (const docType of typesToGenerate) {
      if (!['letter', 'affidavit', 'checklist'].includes(docType)) {
        console.warn(`[generate-docs] Unknown document type: ${docType}`)
        continue
      }

      try {
        const content = await generateDocument(
          docType as 'letter' | 'affidavit' | 'checklist',
          profile,
          scheme
        )

        // Save document
        const filename = `${docType}-${id}.txt`
        const outPath = path.join(process.cwd(), 'public', filename)
        fs.writeFileSync(outPath, content, 'utf8')

        documents[docType] = {
          url: `/${filename}`,
          content,
          type: docType
        }
      } catch (err: any) {
        console.error(`[generate-docs] Failed to generate ${docType}:`, err)
        // Continue with other documents even if one fails
      }
    }

    // If no documents were generated, create fallback documents
    if (Object.keys(documents).length === 0) {
      console.warn('[generate-docs] No documents generated, creating fallback documents')
      const id = uuidv4()
      const fallbackDocs: Record<string, { url: string; content: string; type: string }> = {}
      
      // Create simple fallback documents
      const fallbackLetter = `Application Support Letter

Date: ${new Date().toLocaleDateString('en-IN')}

To Whom It May Concern,

This is to certify that ${profile.name || 'the applicant'} is applying for ${scheme.title || 'the government scheme'}.

Applicant Details:
- Name: ${profile.name || 'Not provided'}
- Age: ${profile.age || 'Not provided'}
- Income: ${profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided'}
- Category: ${profile.caste || 'Not provided'}

We request your kind consideration for this application.

Thank you,
YojanaMitra`

      const fallbackChecklist = `Document Checklist for ${scheme.title || 'Government Scheme'}

Required Documents:
${scheme.required_docs?.map((doc: string, i: number) => `${i + 1}. ${doc}`).join('\n') || 'Please check scheme requirements'}

Documents Available:
${profile.documents?.map((doc: string, i: number) => `✓ ${doc}`).join('\n') || 'None listed'}

Generated by YojanaMitra`

      try {
        const letterPath = path.join(process.cwd(), 'public', `letter-${id}.txt`)
        fs.writeFileSync(letterPath, fallbackLetter, 'utf8')
        fallbackDocs.letter = { url: `/letter-${id}.txt`, content: fallbackLetter, type: 'letter' }
        
        const checklistPath = path.join(process.cwd(), 'public', `checklist-${id}.txt`)
        fs.writeFileSync(checklistPath, fallbackChecklist, 'utf8')
        fallbackDocs.checklist = { url: `/checklist-${id}.txt`, content: fallbackChecklist, type: 'checklist' }
      } catch (err: any) {
        console.error('[generate-docs] Failed to create fallback documents:', err)
      }
      
      if (Object.keys(fallbackDocs).length > 0) {
        return res.status(200).json({
          documents: fallbackDocs,
          id,
          generated: Object.keys(fallbackDocs),
          warning: 'Fallback documents generated due to API limitations'
        })
      }
      
      return res.status(500).json({ 
        error: 'Failed to generate documents. Please check OpenAI API configuration.',
        hint: 'Ensure OPENAI_API_KEY is set in your environment variables'
      })
    }

    return res.status(200).json({
      documents,
      id,
      generated: Object.keys(documents)
    })
  } catch (e: any) {
    console.error('[generate-docs] Error:', e)
    return res.status(500).json({ error: e.message || 'Failed to generate documents' })
  }
}
