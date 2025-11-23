// pages/api/eligibility-builder.ts
// Smart Eligibility Builder with explainable AI, confidence scoring, and next actions
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

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
  description: string
  eligibility: any
  required_docs: string[]
  official_portal_url?: string
}

interface EligibilityResult {
  eligible: boolean
  confidence: number
  confidenceLevel: 'High' | 'Medium' | 'Low'
  explanation: string
  reasons: {
    passed: Array<{ rule: string; reason: string; source?: string }>
    failed: Array<{ rule: string; reason: string; fix?: string }>
    missing: Array<{ field: string; reason: string; action: string }>
  }
  nextActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; description: string }>
  score: number
  ruleBasedScore: number
  aiBasedScore: number
}

// Rule-based eligibility checking
function checkRuleBasedEligibility(profile: Profile, scheme: Scheme): {
  passed: Array<{ rule: string; reason: string }>
  failed: Array<{ rule: string; reason: string; fix?: string }>
  missing: Array<{ field: string; reason: string; action: string }>
  score: number
} {
  const passed: Array<{ rule: string; reason: string }> = []
  const failed: Array<{ rule: string; reason: string; fix?: string }> = []
  const missing: Array<{ field: string; reason: string; action: string }> = []
  let score = 0

  const eligibility = scheme.eligibility || {}

  // Income check
  if (eligibility.income_max) {
    if (profile.income_annual) {
      if (profile.income_annual <= eligibility.income_max) {
        passed.push({
          rule: 'Income Limit',
          reason: `Your income ₹${profile.income_annual.toLocaleString()} is below the scheme limit (₹${eligibility.income_max.toLocaleString()})`
        })
        score += 40
      } else {
        failed.push({
          rule: 'Income Limit',
          reason: `Your income ₹${profile.income_annual.toLocaleString()} exceeds the scheme limit (₹${eligibility.income_max.toLocaleString()})`,
          fix: 'Update your income certificate or declare lower income'
        })
      }
    } else {
      missing.push({
        field: 'Annual Income',
        reason: 'Income information required for eligibility check',
        action: 'Obtain income certificate or upload income proof'
      })
    }
  }

  // Caste/Category check
  if (eligibility.caste && Array.isArray(eligibility.caste)) {
    if (profile.caste) {
      const eligibleCastes = eligibility.caste.map((c: string) => c.toLowerCase())
      if (eligibleCastes.includes((profile.caste || '').toLowerCase())) {
        passed.push({
          rule: 'Category Match',
          reason: `You belong to ${profile.caste} category, which is eligible for this scheme`
        })
        score += 30
      } else {
        failed.push({
          rule: 'Category Match',
          reason: `You belong to ${profile.caste} category, but the scheme is for ${eligibility.caste.join(', ')}`,
          fix: 'Verify your category certificate or select the correct category'
        })
      }
    } else {
      missing.push({
        field: 'Category/Caste',
        reason: 'Category information required',
        action: 'Obtain category certificate (SC/ST/OBC/General)'
      })
    }
  }

  // Education check
  if (eligibility.student || eligibility.education) {
    if (profile.education) {
      const eduLower = (profile.education || '').toLowerCase()
      const requiredEdu = eligibility.education || ''
      if (eduLower.includes(requiredEdu.toLowerCase()) || 
          eduLower.includes('post') || 
          eduLower.includes('higher') || 
          eduLower.includes('graduate')) {
        passed.push({
          rule: 'Education Level',
          reason: `Your education (${profile.education}) matches the scheme requirements`
        })
        score += 20
      } else {
        failed.push({
          rule: 'Education Level',
          reason: `Your education (${profile.education}) does not match the scheme requirement (${requiredEdu})`,
          fix: 'Update your education certificate or select the correct qualification'
        })
      }
    } else {
      missing.push({
        field: 'Education',
        reason: 'Education details required',
        action: 'Upload marksheet or education certificate'
      })
    }
  }

  // State check
  if (scheme.state && scheme.state !== 'All') {
    if (profile.state) {
      if (scheme.state.toLowerCase() === profile.state.toLowerCase()) {
        passed.push({
          rule: 'State Match',
          reason: `You are from ${profile.state}, which is an eligible state for this scheme`
        })
        score += 10
      } else {
        failed.push({
          rule: 'State Match',
          reason: `Scheme is for ${scheme.state}, but you are from ${profile.state}`,
          fix: 'Check state-specific schemes or obtain domicile certificate'
        })
      }
    } else {
      missing.push({
        field: 'State',
        reason: 'State information required',
        action: 'Upload State/Domicile certificate'
      })
    }
  }

  // Documents check
  if (scheme.required_docs && Array.isArray(scheme.required_docs)) {
    const userDocs = profile.documents || []
    const missingDocs = scheme.required_docs.filter((doc: string) => 
      !userDocs.some((ud: string) => ud.toLowerCase().includes(doc.toLowerCase()))
    )
    
    if (missingDocs.length > 0) {
      missingDocs.forEach((doc: string) => {
        missing.push({
          field: doc,
          reason: `${doc} document required for application`,
          action: `Obtain or download ${doc}`
        })
      })
    } else {
      passed.push({
        rule: 'Documents',
        reason: 'All required documents are available'
      })
      score += 10
    }
  }

  return { passed, failed, missing, score }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, schemeId } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'Profile is required' })
  }

  if (!schemeId) {
    return res.status(400).json({ error: 'Scheme ID is required' })
  }

  try {
    // Load scheme data
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json')
    if (!fs.existsSync(schemesPath)) {
      return res.status(404).json({ error: 'Schemes database not found' })
    }

    const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf8'))
    const scheme = schemes.find((s: Scheme) => s.id === schemeId)

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    // Rule-based eligibility check
    const ruleBased = checkRuleBasedEligibility(profile, scheme)
    const ruleBasedScore = ruleBased.score

    // AI-based reasoning for edge cases and explainability
    let aiExplanation = ''
    let aiScore = 0
    let nextActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; description: string }> = []

    if (client) {
      try {
        const prompt = `You are an eligibility expert for Indian government schemes. Analyze this eligibility case:

Scheme: ${scheme.title}
Description: ${scheme.description}
Eligibility Rules: ${JSON.stringify(scheme.eligibility, null, 2)}

User Profile:
- Age: ${profile.age || 'Not provided'}
- State: ${profile.state || 'Not provided'}
- Annual Income: ${profile.income_annual ? `₹${profile.income_annual.toLocaleString()}` : 'Not provided'}
- Category: ${profile.caste || 'Not provided'}
- Education: ${profile.education || 'Not provided'}
- Documents: ${profile.documents?.join(', ') || 'None'}

Rule-Based Analysis:
- Passed: ${ruleBased.passed.length} rules
- Failed: ${ruleBased.failed.length} rules
- Missing: ${ruleBased.missing.length} fields

Provide a JSON response with:
1. "eligible": boolean (true if likely eligible, false if not)
2. "explanation": string (2-3 line explanation in Hinglish explaining why they qualify/don't qualify with specific reasons)
3. "aiScore": number (0-30, additional score based on edge cases and context)
4. "nextActions": array of objects with:
   - "action": string (what user should do)
   - "priority": "high" | "medium" | "low"
   - "description": string (why this action is needed)

Focus on:
- Edge cases (e.g., income slightly above limit but other factors strong)
- Missing information that could change eligibility
- Actionable next steps

Return ONLY valid JSON, no other text.`

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert eligibility analyzer. Always return valid JSON only, no markdown or extra text.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
          temperature: 0.3
        })

        const aiResult = JSON.parse(response.choices[0]?.message?.content || '{}')
        aiExplanation = aiResult.explanation || ''
        aiScore = aiResult.aiScore || 0
        nextActions = aiResult.nextActions || []
      } catch (err: any) {
        console.warn('[eligibility-builder] AI analysis failed:', err.message)
        // Fallback explanation
        aiExplanation = ruleBased.passed.length > ruleBased.failed.length
          ? 'You appear to be eligible for this scheme based on available information.'
          : 'Some additional information or documents are needed to confirm eligibility.'
      }
    } else {
      // Fallback without AI
      aiExplanation = ruleBased.passed.length > ruleBased.failed.length
        ? 'You appear to be eligible for this scheme.'
        : 'Some information is missing to confirm eligibility.'
    }

    // Combine scores
    const totalScore = ruleBasedScore + aiScore
    const maxScore = 100
    const confidence = totalScore / maxScore

    // Determine eligibility
    const eligible = ruleBased.failed.length === 0 && ruleBased.missing.length <= 2 && confidence >= 0.6

    // Generate next actions from missing fields
    if (nextActions.length === 0) {
      ruleBased.missing.forEach((item) => {
        nextActions.push({
          action: item.action,
          priority: item.field.toLowerCase().includes('income') || item.field.toLowerCase().includes('category') ? 'high' : 'medium',
          description: item.reason
        })
      })

      ruleBased.failed.forEach((item) => {
        if (item.fix) {
          nextActions.push({
            action: item.fix,
            priority: 'high',
            description: item.reason
          })
        }
      })
    }

    // Determine confidence level
    let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Medium'
    if (confidence >= 0.8) confidenceLevel = 'High'
    else if (confidence < 0.5) confidenceLevel = 'Low'

    const result: EligibilityResult = {
      eligible,
      confidence,
      confidenceLevel,
      explanation: aiExplanation || `Based on available information, ${eligible ? 'you appear to be eligible' : 'some additional steps are required'}.`,
      reasons: {
        passed: ruleBased.passed.map(p => ({ ...p, source: scheme.official_portal_url })),
        failed: ruleBased.failed,
        missing: ruleBased.missing
      },
      nextActions: nextActions.slice(0, 5), // Top 5 actions
      score: totalScore,
      ruleBasedScore,
      aiBasedScore: aiScore
    }

    return res.status(200).json({
      success: true,
      result,
      scheme: {
        id: scheme.id,
        title: scheme.title,
        official_portal_url: scheme.official_portal_url
      }
    })

  } catch (err: any) {
    console.error('[eligibility-builder] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to analyze eligibility',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

