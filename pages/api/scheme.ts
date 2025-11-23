// pages/api/scheme.ts
// Get individual scheme details
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id, all } = req.query

  try {
    // Try multiple possible paths for schemes.json
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'schemes.json'),
      path.join(process.cwd(), 'public', 'data', 'schemes.json'),
      path.join(process.cwd(), 'YojanaMitra', 'data', 'schemes.json')
    ]

    let schemesPath: string | null = null
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        schemesPath = p
        break
      }
    }

    if (!schemesPath) {
      return res.status(404).json({ error: 'Schemes database not found' })
    }

    const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf8'))

    // If all=true, return all schemes
    if (all === 'true') {
      return res.status(200).json({
        success: true,
        schemes
      })
    }

    // Otherwise, return specific scheme by ID
    if (!id) {
      return res.status(400).json({ error: 'Scheme ID is required (or use ?all=true for all schemes)' })
    }

    const scheme = schemes.find((s: any) => s.id === id)

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    return res.status(200).json({
      success: true,
      scheme
    })

  } catch (err: any) {
    console.error('[scheme] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to fetch scheme',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



