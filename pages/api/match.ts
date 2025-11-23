// pages/api/match.ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'

// Only create client if API key is available
const openaiKey = process.env.OPENAI_API_KEY
const client = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null

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

interface Scheme {
  id: string
  title: string
  state: string
  description: string
  eligibility: any
  required_docs: string[]
  source_url: string
  official_portal_url?: string
  application_url?: string
  last_reviewed: string
}

function scoreScheme(profile: Profile, scheme: Scheme): { score: number; confidence: number; missingFields: string[] } {
  let score = 0
  let confidence = 0
  const missingFields: string[] = []
  
  if (!profile) return { score: 0, confidence: 0, missingFields: [] }

  const checks = {
    income: scheme.eligibility?.income_max && profile.income_annual,
    caste: scheme.eligibility?.caste && profile.caste,
    student: scheme.eligibility?.student && profile.education,
    state: scheme.state && profile.state,
    msme: scheme.eligibility?.msme_required !== undefined
  }

  // Income check
  if (checks.income) {
    if (profile.income_annual! <= scheme.eligibility.income_max) {
      score += 40
      confidence += 0.4
    } else {
      missingFields.push('Income exceeds limit')
    }
  } else if (scheme.eligibility?.income_max) {
    missingFields.push('Annual income')
  }

  // Caste check
  if (checks.caste) {
    const eligibleCastes = scheme.eligibility.caste.map((c: string) => c.toLowerCase())
    if (eligibleCastes.includes((profile.caste || '').toLowerCase())) {
      score += 30
      confidence += 0.3
    } else {
      missingFields.push('Caste category mismatch')
    }
  } else if (scheme.eligibility?.caste) {
    missingFields.push('Caste category')
  }

  // Student/Education check
  if (checks.student) {
    const eduLower = (profile.education || '').toLowerCase()
    if (eduLower.includes('post') || eduLower.includes('higher') || eduLower.includes('graduate')) {
      score += 20
      confidence += 0.2
    } else {
      missingFields.push('Education level')
    }
  } else if (scheme.eligibility?.student) {
    missingFields.push('Education details')
  }

  // State check
  if (checks.state) {
    if (scheme.state === 'All' || scheme.state.toLowerCase() === profile.state?.toLowerCase()) {
      score += 10
      confidence += 0.1
    } else {
      missingFields.push('State mismatch')
    }
  } else if (scheme.state && scheme.state !== 'All') {
    missingFields.push('State information')
  }

  return { score, confidence, missingFields }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile } = req.body
  if (!profile) return res.status(400).json({ error: 'profile required' })

  try {
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json')
    
    // Check if file exists
    if (!fs.existsSync(schemesPath)) {
      console.error('[match] Schemes file not found at:', schemesPath)
      return res.status(500).json({ 
        error: 'Schemes database not found. Please ensure data/schemes.json exists.',
        path: schemesPath
      })
    }
    
    const raw = fs.readFileSync(schemesPath, 'utf8')
    let schemes: Scheme[] = []
    
    try {
      schemes = JSON.parse(raw)
    } catch (parseErr: any) {
      console.error('[match] Failed to parse schemes.json:', parseErr)
      return res.status(500).json({ 
        error: 'Invalid schemes data format',
        details: parseErr.message
      })
    }
    
    if (!Array.isArray(schemes) || schemes.length === 0) {
      console.warn('[match] No schemes found in database')
      return res.status(200).json({ 
        results: [],
        totalSchemes: 0,
        matchedSchemes: 0,
        message: 'No schemes available in database'
      })
    }

    // Score all schemes
    const scored = schemes
      .filter((s: Scheme) => s && s.id && s.title) // Filter out invalid schemes
      .map((s: Scheme) => {
        try {
          const result = scoreScheme(profile, s)
          return { ...s, ...result }
        } catch (err: any) {
          console.error(`[match] Error scoring scheme ${s.id}:`, err)
          return { ...s, score: 0, confidence: 0, missingFields: [] }
        }
      })
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 6)

    // Filter out schemes with 0 score (no match at all)
    const relevantSchemes = scored.filter((s: any) => s.score > 0)
    
    if (relevantSchemes.length === 0) {
      return res.status(200).json({
        results: [],
        totalSchemes: schemes.length,
        matchedSchemes: 0,
        message: 'No matching schemes found. Please provide more information (state, education, etc.)'
      })
    }
    
    // Use RAG with OpenAI to get better explanations
    const top = relevantSchemes.slice(0, 3)
    
    // If OpenAI is not available, return basic results
    if (!client) {
      console.warn('[match] OpenAI not configured, returning basic results')
      const basicResults = top.map((scheme: any) => ({
        scheme: {
          id: scheme.id,
          title: scheme.title,
          description: scheme.description,
          state: scheme.state,
          eligibility: scheme.eligibility,
          required_docs: scheme.required_docs,
          source_url: scheme.source_url,
          official_portal_url: scheme.official_portal_url,
          application_url: scheme.application_url
        },
        score: scheme.score,
        confidence: scheme.confidence,
        confidenceLevel: scheme.confidence > 0.7 ? 'High' : scheme.confidence > 0.4 ? 'Medium' : 'Low',
        explanation: `This scheme may be suitable based on your profile. Score: ${scheme.score}. Please check eligibility criteria.`,
        missingFields: scheme.missingFields,
        needsReview: scheme.confidence < 0.5
      }))
      
      return res.status(200).json({
        results: basicResults,
        totalSchemes: schemes.length,
        matchedSchemes: relevantSchemes.length
      })
    }
    
    // Generate explanations for top schemes
    // Use Promise.allSettled to ensure we get results even if some fail
    const explainPromises = top.map(async (scheme: any) => {
      const schemeContext = `
Scheme: ${scheme.title || 'N/A'}
Description: ${scheme.description || 'N/A'}
State: ${scheme.state || 'N/A'}
Eligibility Requirements: ${JSON.stringify(scheme.eligibility || {}, null, 2)}
Required Documents: ${Array.isArray(scheme.required_docs) ? scheme.required_docs.join(', ') : 'N/A'}
`

      const userContext = `
User Profile:
- Name: ${profile.name || 'Not provided'}
- Age: ${profile.age || 'Not provided'}
- State: ${profile.state || 'Not provided'}
- Annual Income: ${profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided'}
- Caste: ${profile.caste || 'Not provided'}
- Education: ${profile.education || 'Not provided'}
- Documents Available: ${profile.documents?.join(', ') || 'None listed'}
`

      const prompt = `${schemeContext}\n${userContext}\n\nPlease provide:
1. A clear explanation in simple English whether this user is eligible for this scheme
2. Why they are eligible or not eligible (be specific)
3. What information or documents are missing to confirm eligibility
4. Confidence level (High/Medium/Low) based on available information

Keep the response concise (150-200 words) and user-friendly.`

      try {
        if (!client) {
          throw new Error('OpenAI client not available')
        }
        
        const r = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful assistant that explains government schemes in simple terms. Always respond in clear, simple English to make it accessible to all users.' 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
        
        const explanation = r.choices?.[0]?.message?.content || ''
        
        // Determine confidence level from explanation
        let confidenceLevel = 'Medium'
        if (explanation.toLowerCase().includes('high confidence') || scheme.confidence > 0.7) {
          confidenceLevel = 'High'
        } else if (explanation.toLowerCase().includes('low confidence') || scheme.confidence < 0.4 || scheme.missingFields.length > 2) {
          confidenceLevel = 'Low'
        }

        return {
          scheme: {
            id: scheme.id,
            title: scheme.title,
            description: scheme.description,
            state: scheme.state,
            eligibility: scheme.eligibility,
            required_docs: scheme.required_docs,
            source_url: scheme.source_url,
            official_portal_url: scheme.official_portal_url,
            application_url: scheme.application_url
          },
          score: scheme.score,
          confidence: scheme.confidence,
          confidenceLevel,
          explanation,
          missingFields: scheme.missingFields || [],
          needsReview: confidenceLevel === 'Low' || scheme.confidence < 0.5
        }
      } catch (err: any) {
        console.error(`[match] Error explaining scheme ${scheme.id}:`, err.message || err)
        // Return basic result without OpenAI explanation
        return {
          scheme: {
            id: scheme.id,
            title: scheme.title,
            description: scheme.description,
            state: scheme.state,
            eligibility: scheme.eligibility,
            required_docs: scheme.required_docs,
            source_url: scheme.source_url,
            official_portal_url: scheme.official_portal_url,
            application_url: scheme.application_url
          },
          score: scheme.score,
          confidence: scheme.confidence,
          confidenceLevel: scheme.confidence > 0.7 ? 'High' : scheme.confidence > 0.4 ? 'Medium' : 'Low',
          explanation: `You may be eligible for this scheme. Your income is ₹${profile.income_annual?.toLocaleString() || 'N/A'} and you belong to ${profile.caste || 'N/A'} category. Please check the eligibility criteria: ${JSON.stringify(scheme.eligibility)}.`,
          missingFields: scheme.missingFields || [],
          needsReview: scheme.confidence < 0.5
        }
      }
    })
    
    // Use allSettled to handle partial failures gracefully
    const explainResults = await Promise.allSettled(explainPromises)
    const explains = explainResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // If explanation failed, return basic result
        const scheme = top[index]
        console.error(`[match] Failed to explain scheme ${scheme?.id}:`, result.reason)
        return {
          scheme: {
            id: scheme?.id || 'unknown',
            title: scheme?.title || 'Unknown Scheme',
            description: scheme?.description || '',
            state: scheme?.state || 'All',
            eligibility: scheme?.eligibility || {},
            required_docs: Array.isArray(scheme?.required_docs) ? scheme.required_docs : [],
            source_url: scheme?.source_url || '',
            official_portal_url: scheme?.official_portal_url,
            application_url: scheme?.application_url
          },
          score: scheme?.score || 0,
          confidence: scheme?.confidence || 0,
          confidenceLevel: 'Medium',
          explanation: `You may be eligible for this scheme. Please check the eligibility criteria.`,
          missingFields: scheme?.missingFields || [],
          needsReview: true
        }
      }
    })

    return res.status(200).json({ 
      results: explains,
      totalSchemes: schemes.length,
      matchedSchemes: relevantSchemes.length
    })
  } catch (e: any) {
    console.error('[match] Error:', e)
    console.error('[match] Error stack:', e.stack)
    return res.status(500).json({ 
      error: e.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    })
  }
}
