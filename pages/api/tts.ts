// pages/api/tts.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  const { text, language = 'hi', voice = 'alloy' } = req.body
  
  if (!text) return res.status(400).json({ error: 'text required' })
  if (!client) return res.status(500).json({ error: 'OpenAI API key not configured' })

  // Valid voices: alloy, echo, fable, onyx, nova, shimmer
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  const selectedVoice = validVoices.includes(voice) ? voice : 'alloy'

  // Language mapping for TTS
  const languageMap: Record<string, string> = {
    'hi': 'hi', // Hindi
    'en': 'en', // English
    'mr': 'mr', // Marathi
    'ta': 'ta', // Tamil
    'te': 'te', // Telugu
    'kn': 'kn', // Kannada
    'gu': 'gu', // Gujarati
    'bn': 'bn', // Bengali
    'pa': 'pa', // Punjabi
    'ur': 'ur'  // Urdu
  }

  const ttsLanguage = languageMap[language] || 'hi'

  try {
    console.log('[tts] Generating speech:', { text: text.substring(0, 50), language: ttsLanguage, voice: selectedVoice })

    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice as any,
      input: text,
      response_format: 'mp3',
      speed: 1.0
    })

    // Convert response to buffer
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Save audio file
    const fileId = uuidv4()
    const filename = `tts-${fileId}.mp3`
    const outPath = path.join(process.cwd(), 'public', filename)
    fs.writeFileSync(outPath, buffer)

    console.log('[tts] Audio file saved:', filename)

    return res.status(200).json({
      url: `/${filename}`,
      filename,
      duration: Math.ceil(text.length / 10) // Rough estimate: ~10 chars per second
    })
  } catch (err: any) {
    console.error('[tts] Error:', err)
    return res.status(500).json({ error: err.message || 'Failed to generate speech' })
  }
}

