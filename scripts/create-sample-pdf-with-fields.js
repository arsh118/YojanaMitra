// scripts/create-sample-pdf-with-fields.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

(async () => {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Title
    page.drawText('Government Scheme Application Form', { 
      x: 50, 
      y: 750, 
      size: 18, 
      font: boldFont 
    })
    
    // Create form
    const form = pdfDoc.getForm()
    
    // Applicant Name field
    page.drawText('Applicant Name:', { x: 50, y: 700, size: 12, font })
    const nameField = form.createTextField('applicant_name')
    nameField.setText('')
    nameField.addToPage(page, { x: 200, y: 685, width: 300, height: 20 })
    
    // Age field
    page.drawText('Age:', { x: 50, y: 660, size: 12, font })
    const ageField = form.createTextField('age')
    ageField.setText('')
    ageField.addToPage(page, { x: 200, y: 645, width: 100, height: 20 })
    
    // Phone field
    page.drawText('Phone Number:', { x: 50, y: 620, size: 12, font })
    const phoneField = form.createTextField('phone')
    phoneField.setText('')
    phoneField.addToPage(page, { x: 200, y: 605, width: 200, height: 20 })
    
    // State field
    page.drawText('State:', { x: 50, y: 580, size: 12, font })
    const stateField = form.createTextField('state')
    stateField.setText('')
    stateField.addToPage(page, { x: 200, y: 565, width: 200, height: 20 })
    
    // Income field
    page.drawText('Annual Income (INR):', { x: 50, y: 540, size: 12, font })
    const incomeField = form.createTextField('income')
    incomeField.setText('')
    incomeField.addToPage(page, { x: 200, y: 525, width: 200, height: 20 })
    
    // Caste/Category field
    page.drawText('Caste/Category:', { x: 50, y: 500, size: 12, font })
    const casteField = form.createTextField('caste')
    casteField.setText('')
    casteField.addToPage(page, { x: 200, y: 485, width: 200, height: 20 })
    
    // Education field
    page.drawText('Education:', { x: 50, y: 460, size: 12, font })
    const educationField = form.createTextField('education')
    educationField.setText('')
    educationField.addToPage(page, { x: 200, y: 445, width: 300, height: 20 })
    
    // Instructions
    page.drawText('Instructions: Please fill all fields accurately.', { 
      x: 50, 
      y: 400, 
      size: 10, 
      font,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    const pdfBytes = await pdfDoc.save()
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    const outputPath = path.join(publicDir, 'sample-form.pdf')
    fs.writeFileSync(outputPath, pdfBytes)
    console.log('✅ sample-form.pdf created with fillable form fields at:', outputPath)
  } catch (error) {
    console.error('Error creating PDF:', error)
    process.exit(1)
  }
})()

