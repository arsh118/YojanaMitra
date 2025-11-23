// pages/api/review-application.ts
// Approve/reject applications
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { sendMessage } from '../../lib/twilioSend'

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

  const { applicationId, action, reason } = req.body

  if (!applicationId || !action) {
    return res.status(400).json({ error: 'Application ID and action are required' })
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "reject"' })
  }

  try {
    const applications = loadApplications()
    const appIndex = applications.findIndex((app: any) => app.id === applicationId)

    if (appIndex === -1) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const application = applications[appIndex]
    application.status = action === 'approve' ? 'approved' : 'rejected'
    application.reviewedAt = new Date().toISOString()
    application.reviewReason = reason || ''

    applications[appIndex] = application
    saveApplications(applications)

    // Send notification via WhatsApp
    if (application.profile?.phone) {
      const message = action === 'approve'
        ? `Hello ${application.userName}! 👋\n\n✅ *Application Approved*\n\nYour application for *${application.schemeTitle}* has been approved!\n\nNext steps:\n• Go to the official portal for final submission\n• Note down your confirmation number\n\nThank you! 🙏`
        : `Hello ${application.userName}! 👋\n\n❌ *Application Review*\n\nSome issues were found during review of your application *${application.schemeTitle}*.\n\nReason: ${reason || 'Please check required documents'}\n\nPlease complete the missing information and resubmit.\n\nThank you! 🙏`

      try {
        await sendMessage(`whatsapp:${application.profile.phone}`, message)
      } catch (err) {
        console.warn('[review-application] Failed to send WhatsApp notification:', err)
      }
    }

    return res.status(200).json({
      success: true,
      applicationId,
      status: application.status,
      message: `Application ${action}d successfully`
    })

  } catch (err: any) {
    console.error('[review-application] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to review application',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

