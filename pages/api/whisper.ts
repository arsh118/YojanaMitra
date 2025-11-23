// pages/api/whisper.ts
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    maxFileSize: 25 * 1024 * 1024 // 25MB limit
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[whisper] Form parsing error:', err)
      return res.status(500).json({ error: err.message })
    }

    const file = Array.isArray(files.audio) ? files.audio[0] : files.audio
    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' })
    }

    try {
      const buffer = fs.readFileSync((file as any).filepath || (file as any).path)
      const formData = new FormData()
      formData.append('model', 'whisper-1')
      formData.append('file', buffer, {
        filename: (file as any).originalFilename || (file as any).name || 'audio.webm',
        contentType: (file as any).mimetype || 'audio/webm'
      })

      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData as any
      })

      if (!resp.ok) {
        const errorData: any = await resp.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenAI API error: ${resp.statusText}`)
      }

      const data: any = await resp.json()
      
      // Clean up uploaded file
      try {
        fs.unlinkSync((file as any).filepath || (file as any).path)
      } catch (unlinkErr) {
        // Ignore cleanup errors
      }

      return res.status(200).json({ text: data.text || '' })
    } catch (e: any) {
      console.error('[whisper] Error:', e)
      
      // Clean up uploaded file on error
      try {
        fs.unlinkSync((file as any).filepath || (file as any).path)
      } catch (unlinkErr) {
        // Ignore cleanup errors
      }

      return res.status(500).json({ error: e.message || 'Failed to transcribe audio' })
    }
  })
}
