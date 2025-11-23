// pages/api/upload-document.ts
// Upload and validate documents with OCR
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    })

    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.mimetype || '')) {
      fs.unlinkSync(file.filepath)
      return res.status(400).json({ error: 'Invalid file type. Please upload PDF or image file.' })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const ext = path.extname(file.originalFilename || '')
    const newFilename = `${fileId}${ext}`
    const newPath = path.join(uploadDir, newFilename)

    // Move file to final location
    fs.renameSync(file.filepath, newPath)

    const docType = Array.isArray(fields.docType) ? fields.docType[0] : fields.docType
    const url = `/uploads/documents/${newFilename}`

    return res.status(200).json({
      success: true,
      url,
      filename: newFilename,
      docType,
      size: file.size,
      mimetype: file.mimetype
    })

  } catch (err: any) {
    console.error('[upload-document] Error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to upload document',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}



