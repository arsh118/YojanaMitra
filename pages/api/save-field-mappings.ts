// pages/api/save-field-mappings.ts
// Save field mappings for reuse
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const MAPPINGS_FILE = path.join(process.cwd(), 'data', 'field-mappings.json')

function loadMappings(): any[] {
  if (!fs.existsSync(MAPPINGS_FILE)) {
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveMappings(mappings: any[]) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { schemeId, mappings, pdfUrl, department, state } = req.body

  if (!schemeId || !mappings || !Array.isArray(mappings)) {
    return res.status(400).json({ error: 'Scheme ID and mappings array are required' })
  }

  try {
    const allMappings = loadMappings()
    const existingIndex = allMappings.findIndex(
      m => m.schemeId === schemeId && m.pdfUrl === pdfUrl
    )

    const mappingData = {
      id: existingIndex >= 0 ? allMappings[existingIndex].id : `mapping_${Date.now()}`,
      schemeId,
      pdfUrl,
      mappings,
      department: department || 'General',
      state: state || 'All',
      createdAt: existingIndex >= 0 ? allMappings[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      allMappings[existingIndex] = mappingData
    } else {
      allMappings.push(mappingData)
    }

    saveMappings(allMappings)

    return res.status(200).json({
      success: true,
      mappingId: mappingData.id,
      message: 'Field mappings saved successfully'
    })

  } catch (err: any) {
    console.error('[save-field-mappings] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to save mappings',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



