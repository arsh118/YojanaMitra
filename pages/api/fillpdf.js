// pages/api/fillpdf.js
import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { profile } = req.body || {};
  if (!profile) return res.status(400).json({ error: 'no profile' });

  const pdfPath = path.join(process.cwd(), 'public', 'sample-form.pdf');
  if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size === 0) {
    return res.status(500).json({ 
      error: 'Sample PDF not found or empty. Please add a valid PDF form to public/sample-form.pdf',
      suggestion: 'You can create a simple PDF form with fields like "applicant_name" and "dob"'
    });
  }

  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  try {
    if (form.getTextField('applicant_name')) form.getTextField('applicant_name').setText(profile.name || '');
    if (form.getTextField('dob')) form.getTextField('dob').setText(profile.dob || '');
    // add more mappings based on your PDF field names

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(process.cwd(), 'public', `filled_${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);
    const publicUrl = `/filled_${Date.now()}.pdf`;
    // Note: we saved file with a timestamp but the path above won't match. Simpler approach:
    // overwrite a fixed file:
    fs.writeFileSync(path.join(process.cwd(), 'public', 'filled-latest.pdf'), pdfBytes);
    res.json({ url: '/filled-latest.pdf' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'fill failed' });
  }
}
