# Quick Fix: Twilio Configuration Error

## The Problem
You're seeing: "Failed to send kit via WhatsApp. Please check Twilio configuration."

This means Twilio credentials are not set up in `.env.local`.

## Quick Fix (5 minutes)

### Step 1: Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. If you don't have an account, sign up (free, includes $15.50 credit)
3. From Dashboard, copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click eye icon to reveal)

### Step 2: Join WhatsApp Sandbox

1. In Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like: `+1 415 523 8886`
3. Send a WhatsApp message to that number with the join code (e.g., `join <code>`)
4. You'll get a confirmation

### Step 3: Update .env.local

Open `/YojanaMitra/.env.local` and replace these lines:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

**Replace:**
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` → Your actual Account SID
- `your_actual_auth_token_here` → Your actual Auth Token
- Keep `whatsapp:+14155238886` (or use your sandbox number)

### Step 4: Restart Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd YojanaMitra
npm run dev
```

### Step 5: Check Console

You should see:
```
TWILIO DEBUG: { sid: 'AC...', from: 'whatsapp:+14155238886' }
```

If you see this, Twilio is configured! ✅

## Test It

1. Complete an application
2. Click "📱 Send Kit to WhatsApp (7819849984)"
3. Check your WhatsApp - you should receive the message!

## Still Not Working?

### Check 1: Verify .env.local
```bash
cd YojanaMitra
cat .env.local | grep TWILIO
```

Should show your actual credentials (not "your_twilio_account_sid")

### Check 2: Server Logs
Look for:
- `TWILIO DEBUG:` - Should show your Account SID
- `❌ Twilio env vars missing` - Means .env.local not loaded

### Check 3: WhatsApp Sandbox
- Make sure you joined the sandbox
- Send a test message to the sandbox number
- You should receive a reply

## Common Issues

**Issue:** "Twilio not configured"
- **Fix:** Make sure .env.local has real values (not placeholders)
- **Fix:** Restart the server after updating .env.local

**Issue:** "Message failed to send"
- **Fix:** Join the WhatsApp sandbox first
- **Fix:** Check your Twilio account has credits

**Issue:** "Invalid phone number"
- **Fix:** Number format should be: `whatsapp:+917819849984`
- **Fix:** Make sure the number is verified in sandbox

## Need More Help?

See `TWILIO_SETUP.md` for detailed instructions.

