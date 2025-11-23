// pages/api/upload-pdf.ts
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const config = { 
  api: { 
    bodyParser: false,
    externalResolver: true
  } 
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      uploadDir: undefined // Use system temp directory
    })

    const [fields, files] = await form.parse(req)

    // Check if files object exists
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ 
        error: 'No file provided',
        hint: 'Please select a PDF file to upload'
      })
    }

    // Try different possible field names
    const file = (files.pdf as any) || (files.file as any) || (files.upload as any)
    const fileObj = Array.isArray(file) ? file[0] : file
    
    if (!fileObj) {
      console.error('[upload-pdf] No file found in request. Files received:', Object.keys(files))
      return res.status(400).json({ 
        error: 'No PDF file found in upload',
        receivedFields: Object.keys(files),
        hint: 'Please ensure you are uploading a file with the field name "pdf"'
      })
    }

    // Validate it's a PDF (formidable v3 File object structure)
    const mimetype = fileObj.mimetype || fileObj.type || ''
    const filename = fileObj.originalFilename || fileObj.name || ''
    const filepath = fileObj.filepath || (fileObj as any).path
    
    console.log('[upload-pdf] File received:', {
      filename,
      mimetype,
      filepath,
      size: fileObj.size
    })
    
    if (!mimetype.includes('pdf') && !filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ 
        error: 'File must be a PDF',
        receivedType: mimetype || 'unknown',
        filename: filename
      })
    }
    
    if (!filepath) {
      return res.status(400).json({ 
        error: 'File path not found',
        hint: 'The uploaded file could not be processed'
      })
    }

    try {
      // Generate unique filename
      let fileId: string
      try {
        fileId = uuidv4()
      } catch {
        fileId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      const filename = `official-form-${fileId}.pdf`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
        console.log('[upload-pdf] Created upload directory:', uploadDir)
      }

      // Read the uploaded file (formidable v3 File object)
      let fileBuffer: Buffer
      try {
        // In formidable v3, files are saved to a temp location
        // Check if filepath exists first
        if (filepath && fs.existsSync(filepath)) {
          fileBuffer = fs.readFileSync(filepath)
        } else {
          // Try alternative methods for formidable v3
          // The file might be accessible via different properties
          const altPath = (fileObj as any).path || (fileObj as any).filepath
          if (altPath && fs.existsSync(altPath)) {
            fileBuffer = fs.readFileSync(altPath)
          } else if ((fileObj as any).toBuffer) {
            // Some versions have toBuffer method
            fileBuffer = await (fileObj as any).toBuffer()
          } else {
            // Last resort: try to read from the file object's readable stream
            const chunks: Buffer[] = []
            const stream = (fileObj as any).toReadableStream?.() || (fileObj as any).stream
            if (stream) {
              for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk))
              }
              fileBuffer = Buffer.concat(chunks)
            } else {
              throw new Error(`File path not accessible. Tried: ${filepath || 'none'}, ${altPath || 'none'}`)
            }
          }
        }
        
        if (!fileBuffer || fileBuffer.length === 0) {
          return res.status(400).json({ error: 'Uploaded file is empty' })
        }
        
        console.log('[upload-pdf] File read successfully, size:', fileBuffer.length)
      } catch (readErr: any) {
        console.error('[upload-pdf] Error reading file:', readErr)
        console.error('[upload-pdf] File object keys:', Object.keys(fileObj))
        return res.status(500).json({ 
          error: 'Failed to read uploaded file',
          details: readErr.message,
          filepath: filepath || 'not found',
          hint: 'Please try uploading the file again'
        })
      }

      // Save to permanent location
      const filePath = path.join(uploadDir, filename)
      try {
        fs.writeFileSync(filePath, fileBuffer)
        console.log('[upload-pdf] PDF saved successfully:', filePath, 'Size:', fileBuffer.length)
      } catch (writeErr: any) {
        console.error('[upload-pdf] Error writing file:', writeErr)
        return res.status(500).json({ 
          error: 'Failed to save uploaded file',
          details: writeErr.message,
          hint: 'Please check file permissions for the uploads directory'
        })
      }

      // Clean up temporary file
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath)
        }
      } catch (unlinkErr) {
        console.warn('[upload-pdf] Could not clean up temp file:', unlinkErr)
        // Ignore cleanup errors - not critical
      }

      return res.status(200).json({
        url: `/uploads/${filename}`,
        filename,
        size: fileBuffer.length,
        message: 'PDF uploaded successfully'
      })
    } catch (e: any) {
      console.error('[upload-pdf] Unexpected error:', e)
      console.error('[upload-pdf] Error stack:', e.stack)
      return res.status(500).json({ 
        error: e.message || 'Failed to upload PDF',
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      })
    }
  } catch (parseErr: any) {
    console.error('[upload-pdf] Form parsing error:', parseErr)
    return res.status(500).json({ 
      error: parseErr.message || 'Failed to parse uploaded file',
      details: 'Please ensure the file is a valid PDF and under 10MB',
      stack: process.env.NODE_ENV === 'development' ? parseErr.stack : undefined
    })
  }
}

