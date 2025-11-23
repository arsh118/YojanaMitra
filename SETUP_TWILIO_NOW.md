# 🚀 Setup Twilio Now (5 Minutes)

## Current Status
Your `.env.local` has placeholder values. You need to replace them with real Twilio credentials.

## Quick Setup Steps

### Step 1: Get Twilio Account (2 minutes)

1. **Go to:** https://www.twilio.com/try-twilio
2. **Sign up** (free account, includes $15.50 credit)
3. **Verify** your email and phone number

### Step 2: Get Your Credentials (1 minute)

1. **Log in to:** https://console.twilio.com/
2. **Dashboard** → You'll see:
   - **Account SID** (starts with `AC...`) - Copy this
   - **Auth Token** - Click 👁️ icon to reveal, then copy

### Step 3: Get WhatsApp Sandbox Number (1 minute)

1. In Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see: **Sandbox number** like `+1 415 523 8886`
3. You'll see: **Join code** like `join <code>`
4. **Send WhatsApp message** to `+1 415 523 8886` with the join code
5. You'll get confirmation: "You're all set!"

### Step 4: Update .env.local (1 minute)

Open `/YojanaMitra/.env.local` and replace these 3 lines:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

**Replace:**
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` → Your Account SID (from Step 2)
- `your_actual_auth_token_here` → Your Auth Token (from Step 2)
- Keep `whatsapp:+14155238886` (or use your sandbox number)

### Step 5: Restart Server

```bash
# Stop server (Ctrl+C in terminal)
cd YojanaMitra
npm run dev
```

### Step 6: Verify It Works

Check the console - you should see:
```
TWILIO DEBUG: { sid: 'AC...', from: 'whatsapp:+14155238886' }
```

If you see this ✅, Twilio is configured!

## Test It

1. Complete an application in the app
2. Click "📱 Send Kit to WhatsApp (7819849984)"
3. Check your WhatsApp - you should receive the message!

## Still Not Working?

### Check 1: Verify credentials are real
```bash
cd YojanaMitra
cat .env.local | grep TWILIO
```

Should show your actual credentials (NOT "your_twilio_account_sid")

### Check 2: Server restart
- Did you restart the server after updating `.env.local`?
- Check console for `TWILIO DEBUG:` message

### Check 3: WhatsApp Sandbox
- Did you join the sandbox? (Send join code to +1 415 523 8886)
- Did you get confirmation message?

## Example of Correct .env.local

```env
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr678
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

**Note:** These are examples - use YOUR actual values!

## Need Help?

- Twilio Console: https://console.twilio.com/
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- See `TWILIO_SETUP.md` for more details

