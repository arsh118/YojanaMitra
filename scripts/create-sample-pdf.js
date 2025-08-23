// scripts/create-sample-pdf.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSamplePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  
  // Add title
  page.drawText('Government Scheme Application Form', {
    x: 50,
    y: 750,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  });
  
  // Add form fields
  page.drawText('Applicant Name:', {
    x: 50,
    y: 700,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('Date of Birth:', {
    x: 50,
    y: 650,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('Age:', {
    x: 50,
    y: 600,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('Income:', {
    x: 50,
    y: 550,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('State:', {
    x: 50,
    y: 500,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('Category:', {
    x: 50,
    y: 450,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  page.drawText('Education:', {
    x: 50,
    y: 400,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });
  
  // Add text fields that can be filled
  const form = pdfDoc.getForm();
  
  const nameField = form.createTextField('applicant_name');
  nameField.addToPage(page, { x: 200, y: 700, width: 200, height: 20 });
  
  const dobField = form.createTextField('dob');
  dobField.addToPage(page, { x: 200, y: 650, width: 200, height: 20 });
  
  const ageField = form.createTextField('age');
  ageField.addToPage(page, { x: 200, y: 600, width: 200, height: 20 });
  
  const incomeField = form.createTextField('income');
  incomeField.addToPage(page, { x: 200, y: 550, width: 200, height: 20 });
  
  const stateField = form.createTextField('state');
  stateField.addToPage(page, { x: 200, y: 500, width: 200, height: 20 });
  
  const categoryField = form.createTextField('category');
  categoryField.addToPage(page, { x: 200, y: 450, width: 200, height: 20 });
  
  const educationField = form.createTextField('education');
  educationField.addToPage(page, { x: 200, y: 400, width: 200, height: 20 });
  
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '../public/sample-form.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log('✅ Sample PDF form created successfully at:', outputPath);
  console.log('📝 Form fields: applicant_name, dob, age, income, state, category, education');
}

createSamplePDF().catch(console.error);
