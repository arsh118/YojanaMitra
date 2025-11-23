# Twilio Setup Guide for WhatsApp/SMS

## Step 1: Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account (includes $15.50 credit for testing)
3. Verify your email and phone number

## Step 2: Get Your Twilio Credentials

### Account SID and Auth Token

1. Log in to [Twilio Console](https://console.twilio.com/)
2. Go to **Dashboard**
3. You'll see:
   - **Account SID**: Copy this value (starts with `AC...`)
   - **Auth Token**: Click the eye icon to reveal, then copy

### WhatsApp Sandbox Number (For Testing)

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like: `whatsapp:+14155238886`
3. Join the sandbox by sending the join code to this number from your WhatsApp
4. Use this format: `whatsapp:+14155238886`

## Step 3: Configure .env.local

Open `/YojanaMitra/.env.local` and update these lines:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

**Important:**
- Replace `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Account SID
- Replace `your_auth_token_here` with your actual Auth Token
- The `TWILIO_FROM_NUMBER` should be in format: `whatsapp:+14155238886` (for sandbox) or `whatsapp:+1XXXXXXXXXX` (for production)

## Step 4: Test Your Configuration

1. Restart your Next.js server:
   ```bash
   npm run dev
   ```

2. Check the console logs - you should see:
   ```
   TWILIO DEBUG: { sid: 'AC...', from: 'whatsapp:+14155238886' }
   ```

3. Try sending a test message through the app

## Step 5: Join WhatsApp Sandbox (For Testing)

1. Send a WhatsApp message to: `+1 415 523 8886`
2. Send the join code shown in Twilio Console (e.g., `join <code>`)
3. You'll receive a confirmation message

## Step 6: Production Setup (Optional)

For production with your own WhatsApp number:

1. Go to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Request a WhatsApp Business number (requires approval)
3. Once approved, update `TWILIO_FROM_NUMBER` with your verified number

## Troubleshooting

### Error: "Twilio not configured"
- Check that all three environment variables are set
- Restart the server after updating `.env.local`
- Verify no extra spaces in the values

### Error: "Invalid phone number"
- Ensure phone numbers are in E.164 format: `+91XXXXXXXXXX`
- For WhatsApp, use: `whatsapp:+91XXXXXXXXXX`

### Error: "Message failed to send"
- Verify you've joined the WhatsApp sandbox
- Check your Twilio account has credits
- Ensure the recipient number is verified (for sandbox)

## Example .env.local

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr678
TWILIO_FROM_NUMBER=whatsapp:+14155238886
```

## Security Notes

- **Never commit `.env.local` to git** (it's already in `.gitignore`)
- Keep your Auth Token secret
- Use environment variables in production (not hardcoded values)

## Need Help?

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Support](https://support.twilio.com/)

