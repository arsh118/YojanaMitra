# YojanaMitra Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd YojanaMitra
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the `YojanaMitra` directory:
   ```env
   # Required: OpenAI API Key
   OPENAI_API_KEY=sk-your-openai-api-key-here

   # Required: Twilio for WhatsApp/SMS
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_FROM_NUMBER=whatsapp:+14155238886

   # Optional: Supabase (for database storage)
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Checklist

✅ **Multilingual Voice & Text Interface**
- Voice recording with browser MediaRecorder API
- OpenAI Whisper for speech-to-text transcription
- Text-to-Speech (TTS) support via OpenAI

✅ **Intelligent Scheme Matching**
- RAG-based scheme matching with confidence scoring
- Explains eligibility in simple Hinglish
- Flags low-confidence matches for review

✅ **Automated Form Filling**
- Extracts PDF form fields automatically
- Maps user profile data to form fields
- Generates filled PDF ready for download

✅ **Automated Document Support**
- Generates supporting letters
- Creates affidavits
- Produces personalized checklists

✅ **Smart Reminders**
- WhatsApp/SMS integration via Twilio
- Send reminders and follow-ups

✅ **Human-in-the-Loop**
- Confidence scoring system
- Flags applications needing review
- Review API endpoint for quality assurance

✅ **One-Click Application Kit**
- Creates zip file with all documents
- Includes filled form, letters, affidavits, checklist
- README with instructions

## API Endpoints

All endpoints are in `pages/api/`:

- `POST /api/profile` - Extract structured profile from text
- `POST /api/whisper` - Transcribe audio to text
- `POST /api/match` - Find matching schemes with RAG
- `POST /api/fillpdf` - Auto-fill PDF forms
- `POST /api/generate-docs` - Generate supporting documents
- `POST /api/kit` - Create downloadable application kit
- `POST /api/send-reminder` - Send WhatsApp/SMS reminders
- `POST /api/tts` - Convert text to speech
- `POST /api/review` - Flag applications for human review

## Testing the Complete Flow

1. **Start the app**: `npm run dev`
2. **Open browser**: Go to http://localhost:3000
3. **Enter user info**: Type or record voice input
   - Example: "Mera naam Rahul hai. Main 25 saal ka hoon. Main Uttar Pradesh se hoon. Meri annual income ₹2,00,000 hai. Main SC category se hoon."
4. **View matched schemes**: System will show recommended schemes
5. **Select a scheme**: Click "Fill Application Form"
6. **Download kit**: Get the complete application package

## Troubleshooting

### OpenAI API Errors
- Ensure `OPENAI_API_KEY` is set correctly
- Check your OpenAI account has sufficient credits
- Verify API key has access to Whisper, GPT-4, and TTS models

### Twilio Errors
- Verify Twilio credentials are correct
- Ensure WhatsApp is enabled in your Twilio account
- Check `TWILIO_FROM_NUMBER` format (should be `whatsapp:+14155238886`)

### PDF Filling Issues
- Ensure PDF has fillable form fields
- Check that `public/sample-form.pdf` exists
- PDF-lib works best with AcroForm PDFs

### Voice Recording Issues
- Browser must support MediaRecorder API
- User must grant microphone permissions
- Works best in Chrome/Edge browsers

## Production Deployment

1. Set environment variables in your hosting platform
2. Build the application: `npm run build`
3. Start production server: `npm start`
4. Configure n8n workflows for automated reminders
5. Set up Supabase for persistent data storage

## Support

For issues or questions, please check the main README.md file.

