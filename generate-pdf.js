// generate-pdf.js
// Simple script to test PDF generation

const testProfile = {
  name: "Arsh",
  dob: "2005-10-19",
  age: 19,
  income: 150000,
  state: "Uttar Pradesh",
  category: "OBC",
  education: "BCA"
};

console.log('🚀 Testing PDF Generation...');
console.log('Profile:', testProfile);

// Test the fillpdf API
fetch('http://localhost:3000/api/fillpdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profile: testProfile })
})
.then(response => response.json())
.then(data => {
  console.log('✅ PDF Generated Successfully!');
  console.log('Response:', data);
  console.log('📥 Access your PDF at: http://localhost:3000/filled-latest.pdf');
})
.catch(error => {
  console.error('❌ Error:', error.message);
});
