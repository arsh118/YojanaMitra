// test-complete-flow.js
// This script demonstrates the complete YojanaMitra flow:
// 1. Profile Extraction → 2. PDF Filling → 3. Download

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  console.log('🚀 Testing Complete YojanaMitra Flow\n');
  
  try {
    // Step 1: Profile Extraction
    console.log('📋 Step 1: Extracting Profile from Text...');
    const profileText = "I am Arsh, 19 years old, studying BCA, family income ₹150000, domicile Uttar Pradesh, OBC, I have my mark sheet and Aadhaar";
    
    const profileResponse = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: profileText })
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile API failed: ${profileResponse.status}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile extracted successfully:');
    console.log(JSON.stringify(profileData, null, 2));
    
    // Step 2: PDF Filling
    console.log('\n📄 Step 2: Filling PDF Form...');
    const pdfResponse = await fetch(`${BASE_URL}/api/fillpdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profile: {
          name: profileData.profile?.name || "Arsh",
          dob: "2006-01-01",
          age: profileData.profile?.age || 19,
          income: profileData.profile?.income_annual || 150000,
          state: profileData.profile?.domicile_state || "Uttar Pradesh",
          category: profileData.profile?.caste_category || "OBC",
          education: profileData.profile?.education_level || "BCA"
        }
      })
    });
    
    if (!pdfResponse.ok) {
      throw new Error(`PDF API failed: ${pdfResponse.status}`);
    }
    
    const pdfData = await pdfResponse.json();
    console.log('✅ PDF filled successfully:');
    console.log(JSON.stringify(pdfData, null, 2));
    
    // Step 3: Download Link
    console.log('\n📥 Step 3: Download Ready!');
    console.log(`🎯 Download your filled form at: ${BASE_URL}${pdfData.url}`);
    
    console.log('\n🎉 Complete YojanaMitra Flow Success!');
    console.log('✅ Profile → Map → Filled Form → Download');
    
  } catch (error) {
    console.error('❌ Flow failed:', error.message);
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
}

testCompleteFlow();
