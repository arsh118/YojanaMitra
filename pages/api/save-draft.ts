// pages/api/save-draft.ts
// Save application draft for resume later
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const DRAFTS_FILE = path.join(process.cwd(), 'data', 'drafts.json')

function loadDrafts(): any[] {
  if (!fs.existsSync(DRAFTS_FILE)) {
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveDrafts(drafts: any[]) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Save draft
    const { id, schemeId, profile, uploadedDocs, lastSaved } = req.body

    if (!id || !schemeId) {
      return res.status(400).json({ error: 'Draft ID and scheme ID are required' })
    }

    const drafts = loadDrafts()
    const existingIndex = drafts.findIndex(d => d.id === id)

    const draft = {
      id,
      schemeId,
      profile,
      uploadedDocs: Object.keys(uploadedDocs || {}),
      lastSaved: lastSaved || new Date().toISOString(),
      createdAt: existingIndex >= 0 ? drafts[existingIndex].createdAt : new Date().toISOString()
    }

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft
    } else {
      drafts.push(draft)
    }

    saveDrafts(drafts)

    return res.status(200).json({
      success: true,
      draftId: id,
      resumeLink: `/application-wizard?schemeId=${schemeId}&draftId=${id}`
    })

  } else if (req.method === 'GET') {
    // Get draft
    const { draftId, schemeId } = req.query

    const drafts = loadDrafts()
    const draft = drafts.find(d => 
      d.id === draftId || (schemeId && d.schemeId === schemeId)
    )

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' })
    }

    return res.status(200).json({ success: true, draft })

  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}



