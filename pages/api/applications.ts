// pages/api/applications.ts
// Get applications for review dashboard
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const APPLICATIONS_FILE = path.join(process.cwd(), 'data', 'applications.json')

function loadApplications(): any[] {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(APPLICATIONS_FILE, 'utf8'))
  } catch {
    return []
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { filter, status, confidence } = req.query

  try {
    let applications = loadApplications()

    // Apply filters
    if (status) {
      applications = applications.filter((app: any) => app.status === status)
    }

    if (confidence) {
      const minConfidence = parseFloat(confidence as string)
      applications = applications.filter((app: any) => app.confidence < minConfidence)
    }

    // Sort by date (newest first)
    applications.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return res.status(200).json({
      success: true,
      applications,
      count: applications.length
    })

  } catch (err: any) {
    console.error('[applications] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to load applications',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



