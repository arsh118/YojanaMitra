// pages/api/profile.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openaiKey = process.env.OPENAI_API_KEY
const client = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text required in body' })

  console.log('[profile] incoming text:', text)

  // quick local fallback parser (very simple) if OpenAI is not available
  const localFallback = () => {
    const out: any = {}
    const textLower = text.toLowerCase()
    
    // Extract name
    const nameMatch = text.match(/name\s+is\s+([A-Za-z]+)/i) || text.match(/my\s+name\s+is\s+([A-Za-z]+)/i) || text.match(/i\s+am\s+([A-Za-z]+)/i)
    if (nameMatch) out.name = nameMatch[1]
    
    // Extract age
    const ageMatch = text.match(/(\b|^)(\d{1,2})\s*(?:years?\s+old|saal|age)/i) || text.match(/(?:am|is)\s+(\d{1,2})\s+(?:years?\s+old|saal)/i) || text.match(/(\b|^)(\d{2})(\b|$)/)
    if (ageMatch) out.age = Number(ageMatch[ageMatch.length - 1] || ageMatch[2] || ageMatch[1])
    
    // Extract income
    const incMatch = text.match(/income(?: is|:)?\s*[₹]?\s*([0-9,]+)/i) || text.match(/annual\s+income(?: is|:)?\s*[₹]?\s*([0-9,]+)/i) || text.match(/income\s+of\s*[₹]?\s*([0-9,]+)/i)
    if (incMatch) out.income_annual = Number(String(incMatch[1]).replace(/,/g, ''))
    
    // Extract caste
    if (textLower.includes('obc') || textLower.includes('other backward class')) {
      out.caste = 'OBC'
    } else if (textLower.includes('sc') || textLower.includes('scheduled caste')) {
      out.caste = 'SC'
    } else if (textLower.includes('st') || textLower.includes('scheduled tribe')) {
      out.caste = 'ST'
    } else if (textLower.includes('general') || textLower.includes('gen')) {
      out.caste = 'General'
    } else if (textLower.includes('ews')) {
      out.caste = 'EWS'
    }
    
    // Extract state (basic)
    const stateMatch = text.match(/from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) || text.match(/state[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (stateMatch) out.state = stateMatch[1]
    
    return out
  }

  if (!client) {
    console.warn('[profile] OpenAI key missing — using local fallback parser')
    const prof = localFallback()
    return res.status(200).json({ profile: prof })
  }

  try {
    // Use tools (newer API) for structured output
    const toolSchema = {
      type: 'function' as const,
      function: {
        name: 'extract_profile',
        description: 'Extract user profile information from text. Extract caste as "OBC", "SC", "ST", "General", etc. Extract state name if mentioned.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Full name of the user' },
            age: { type: 'integer', description: 'Age in years' },
            phone: { type: 'string', description: 'Phone number if mentioned' },
            state: { type: 'string', description: 'State name (e.g., "Uttar Pradesh", "Maharashtra")' },
            income_annual: { type: 'number', description: 'Annual income in rupees' },
            caste: { type: 'string', description: 'Caste category: OBC, SC, ST, General, EWS, etc.' },
            education: { type: 'string', description: 'Education level or qualification' },
            documents: { type: 'array', items: { type: 'string' }, description: 'List of documents mentioned' }
          }
        }
      }
    }

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful parser that extracts user profile information. When you see "obc category" or "obc", extract caste as "OBC". Extract state names properly. Return structured data.' 
        },
        { role: 'user', content: `Extract profile information from this text: ${text}` }
      ],
      tools: [toolSchema],
      tool_choice: { type: 'function', function: { name: 'extract_profile' } },
      max_tokens: 500
    })

    const choice = resp.choices?.[0]
    if (!choice) {
      console.warn('[profile] OpenAI returned no choices', resp)
      return res.status(500).json({ error: 'OpenAI no choices', raw: resp })
    }

    // Check for tool calls (newer API format)
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0]
      if (toolCall.type === 'function' && toolCall.function?.name === 'extract_profile' && toolCall.function?.arguments) {
        let parsed: any = {}
        try {
          parsed = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments
        } catch (err) {
          console.warn('[profile] Failed to JSON.parse tool arguments', err)
          parsed = { raw: toolCall.function.arguments }
        }
        console.log('[profile] parsed from tool_call:', parsed)
        
        // Normalize caste values
        if (parsed.caste) {
          const casteUpper = String(parsed.caste).toUpperCase()
          if (casteUpper.includes('OBC')) parsed.caste = 'OBC'
          else if (casteUpper.includes('SC')) parsed.caste = 'SC'
          else if (casteUpper.includes('ST')) parsed.caste = 'ST'
          else if (casteUpper.includes('GENERAL') || casteUpper.includes('GEN')) parsed.caste = 'General'
        }
        
        return res.status(200).json({ profile: parsed })
      }
    }

    // Fallback: check for function_call (older API format)
    if (choice.message?.function_call?.arguments) {
      const argsRaw = choice.message.function_call.arguments
      let parsed: any = {}
      try {
        parsed = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw
      } catch (err) {
        console.warn('[profile] Failed to JSON.parse function args', err)
        parsed = { raw: argsRaw }
      }
      
      // Normalize caste values
      if (parsed.caste) {
        const casteUpper = String(parsed.caste).toUpperCase()
        if (casteUpper.includes('OBC')) parsed.caste = 'OBC'
        else if (casteUpper.includes('SC')) parsed.caste = 'SC'
        else if (casteUpper.includes('ST')) parsed.caste = 'ST'
      }
      
      console.log('[profile] parsed from function_call:', parsed)
      return res.status(200).json({ profile: parsed })
    }

    // Last fallback: try to parse content as JSON
    const content = choice.message?.content || ''
    console.log('[profile] fallback content:', content)
    try {
      const maybeJson: any = JSON.parse(content)
      // Normalize caste in parsed JSON
      if (maybeJson.caste) {
        const casteUpper = String(maybeJson.caste).toUpperCase()
        if (casteUpper.includes('OBC')) maybeJson.caste = 'OBC'
        else if (casteUpper.includes('SC')) maybeJson.caste = 'SC'
        else if (casteUpper.includes('ST')) maybeJson.caste = 'ST'
      }
      return res.status(200).json({ profile: maybeJson })
    } catch (e) {
      // Final fallback: use local parser
      console.log('[profile] Using local fallback parser')
      const prof = localFallback()
      return res.status(200).json({ profile: prof })
    }
  } catch (err: any) {
    console.error('[profile] handler error:', err)
    // Fallback to local parser on error
    const prof = localFallback()
    return res.status(200).json({ profile: prof })
  }
}
