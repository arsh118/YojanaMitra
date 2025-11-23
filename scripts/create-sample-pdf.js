// scripts/create-sample-pdf.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const fs = require('fs')
;(async ()=>{
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  page.drawText('Sample Application Form', { x:50, y:750, size:18, font })
  page.drawText('Applicant Name:', { x:50, y:700, size:12, font })
  page.drawText('Age:', { x:50, y:660, size:12, font })
  page.drawText('State:', { x:50, y:620, size:12, font })
  page.drawText('Income (INR):', { x:50, y:580, size:12, font })
  // NOTE: pdf-lib doesn't create interactive fields nicely in pure JS easily.
  // We'll add blank lines - above fillPdf code expects form fields; for demo,
  // replace fill logic to write text directly on coordinates instead of using form.
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('./public/sample-form.pdf', pdfBytes)
  console.log('sample-form.pdf created')
})()
