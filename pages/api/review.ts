// pages/api/review.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ReviewRequest {
  profile: any
  scheme: any
  filledForm?: any
  confidence: number
  confidenceLevel: string
  missingFields?: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { profile, scheme, filledForm, confidence, confidenceLevel, missingFields } = req.body as ReviewRequest

  if (!profile || !scheme) {
    return res.status(400).json({ error: 'profile and scheme required' })
  }

  try {
    // Determine if review is needed
    const needsReview = 
      confidence < 0.5 ||
      confidenceLevel === 'Low' ||
      (missingFields && missingFields.length > 2) ||
      !profile.phone ||
      !profile.name

    if (!needsReview) {
      return res.status(200).json({
        needsReview: false,
        message: 'Application looks good. No review needed.',
        confidence,
        confidenceLevel
      })
    }

    // Generate review summary for human reviewer
    const reviewPrompt = `A user application for ${scheme.title} has been flagged for human review.

User Profile:
${JSON.stringify(profile, null, 2)}

Scheme: ${scheme.title}
Confidence Score: ${confidence} (${confidenceLevel})
Missing Fields: ${missingFields?.join(', ') || 'None'}

Please provide:
1. A brief summary of why this application needs review
2. Key concerns or missing information
3. Recommended action (approve, request more info, reject with reason)
4. Priority level (High/Medium/Low)

Keep it concise and actionable.`

    let reviewSummary = ''
    if (client) {
      try {
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a quality assurance reviewer for government scheme applications. Provide clear, actionable feedback.'
            },
            { role: 'user', content: reviewPrompt }
          ],
          max_tokens: 300
        })
        reviewSummary = response.choices[0]?.message?.content || ''
      } catch (err) {
        console.error('[review] Error generating review summary:', err)
      }
    }

    // In a real system, you would save this to a database for human reviewers
    // For now, we'll return the review information

    return res.status(200).json({
      needsReview: true,
      reviewId: `review_${Date.now()}`,
      confidence,
      confidenceLevel,
      missingFields: missingFields || [],
      reviewSummary: reviewSummary || 'Application flagged for review due to low confidence score or missing information.',
      priority: confidence < 0.3 ? 'High' : confidence < 0.5 ? 'Medium' : 'Low',
      recommendedAction: missingFields && missingFields.length > 3 ? 'Request more information' : 'Review and verify',
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[review] Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to process review request' })
  }
}

