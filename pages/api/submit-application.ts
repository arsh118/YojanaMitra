// pages/api/submit-application.ts
// Submit complete application
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

function saveApplications(applications: any[]) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { schemeId, profile, documents, draftId } = req.body

  if (!schemeId || !profile) {
    return res.status(400).json({ error: 'Scheme ID and profile are required' })
  }

  try {
    // Load scheme to get details
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json')
    const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf8'))
    const scheme = schemes.find((s: any) => s.id === schemeId)

    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' })
    }

    // Calculate confidence score (simplified)
    let confidence = 0.8
    const missingDocs = scheme.required_docs?.filter((doc: string) => 
      !Object.keys(documents || {}).some(d => d.toLowerCase().includes(doc.toLowerCase()))
    ) || []

    if (missingDocs.length > 0) {
      confidence = 0.6
    }

    // Generate AI notes
    const aiNotes = `Application submitted for ${scheme.title}. 
    Profile completeness: ${Object.keys(profile).length} fields filled.
    Documents uploaded: ${Object.keys(documents || {}).length}/${scheme.required_docs?.length || 0}.
    ${missingDocs.length > 0 ? `Missing: ${missingDocs.join(', ')}` : 'All required documents present.'}`

    // Create application record
    const application = {
      id: `app_${uuidv4()}`,
      userId: profile.phone || 'unknown',
      userName: profile.name || 'Unknown User',
      schemeId,
      schemeTitle: scheme.title,
      profile,
      documents: documents || {},
      confidence,
      status: confidence < 0.7 ? 'needs_review' : 'pending',
      aiNotes,
      parsedFields: profile, // In real implementation, parse from documents
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save application
    const applications = loadApplications()
    applications.push(application)
    saveApplications(applications)

    // Delete draft if exists
    if (draftId) {
      const draftsPath = path.join(process.cwd(), 'data', 'drafts.json')
      if (fs.existsSync(draftsPath)) {
        const drafts = JSON.parse(fs.readFileSync(draftsPath, 'utf8'))
        const filtered = drafts.filter((d: any) => d.id !== draftId)
        fs.writeFileSync(draftsPath, JSON.stringify(filtered, null, 2))
      }
    }

    return res.status(200).json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted successfully',
      status: application.status,
      nextSteps: [
        'Application is under review',
        'You will receive updates via WhatsApp',
        'Check status in your dashboard'
      ]
    })

  } catch (err: any) {
    console.error('[submit-application] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



