// pages/api/n8n-reminder.ts
// API endpoint for n8n to trigger reminders via webhook
import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/twilioSend'

interface ReminderRequest {
  phone: string
  userName?: string
  schemeTitle?: string
  reminderType: 'deadline' | 'missing_docs' | 'follow_up' | 'custom'
  deadline?: string
  missingDocuments?: string[]
  message?: string
  customData?: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Support both GET and POST for n8n flexibility
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' })
  }

  try {
    // Get data from request (n8n can send as body or query params)
    const data: ReminderRequest = req.method === 'POST' 
      ? req.body 
      : req.query as any

    const {
      phone,
      userName,
      schemeTitle,
      reminderType,
      deadline,
      missingDocuments = [],
      message,
      customData
    } = data

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ 
        error: 'Phone number is required',
        received: { phone: !!phone }
      })
    }

    if (!reminderType) {
      return res.status(400).json({ 
        error: 'Reminder type is required',
        validTypes: ['deadline', 'missing_docs', 'follow_up', 'custom']
      })
    }

    // Format phone number
    const phoneNumber = phone.replace(/\D/g, '')
    if (phoneNumber.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please provide a valid 10-digit phone number.'
      })
    }

    const formattedTo = `whatsapp:+91${phoneNumber}`

    // Build reminder message based on type
    const escapeWhatsApp = (text: string) => (text || '').replace(/[*_~`]/g, '')
    
    let reminderMessage = ''

    switch (reminderType) {
      case 'deadline':
        reminderMessage = buildDeadlineReminder(userName, schemeTitle, deadline, message)
        break
      
      case 'missing_docs':
        reminderMessage = buildMissingDocsReminder(userName, schemeTitle, missingDocuments, message)
        break
      
      case 'follow_up':
        reminderMessage = buildFollowUpReminder(userName, schemeTitle, message)
        break
      
      case 'custom':
        reminderMessage = message || 'Reminder from YojanaMitra'
        break
      
      default:
        return res.status(400).json({ 
          error: `Invalid reminder type: ${reminderType}`,
          validTypes: ['deadline', 'missing_docs', 'follow_up', 'custom']
        })
    }

    // Add custom data if provided
    if (customData && Object.keys(customData).length > 0) {
      reminderMessage += `\n\n📋 *Additional Info:*\n`
      Object.entries(customData).forEach(([key, value]) => {
        reminderMessage += `• ${escapeWhatsApp(key)}: ${escapeWhatsApp(String(value))}\n`
      })
    }

    // Add footer
    reminderMessage += `\n\nThank you! 🙏\n*YojanaMitra Team*`

    console.log('[n8n-reminder] Sending reminder:', {
      to: formattedTo,
      type: reminderType,
      phone: phoneNumber
    })

    // Send via WhatsApp
    const result = await sendMessage(formattedTo, reminderMessage)

    if (!result.success) {
      console.error('[n8n-reminder] Failed:', result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send reminder',
        hint: 'Please check Twilio configuration',
        sent: false
      })
    }

    console.log('[n8n-reminder] Success:', result.sid)
    return res.status(200).json({
      success: true,
      messageId: result.sid,
      sent: true,
      to: formattedTo,
      reminderType,
      timestamp: new Date().toISOString()
    })

  } catch (err: any) {
    console.error('[n8n-reminder] Error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process reminder request',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}

function buildDeadlineReminder(
  userName?: string,
  schemeTitle?: string,
  deadline?: string,
  customMessage?: string
): string {
  const escapeWhatsApp = (text: string) => (text || '').replace(/[*_~`]/g, '')
  
  let message = `Hello ${escapeWhatsApp(userName || 'User')}! 👋\n\n`
  message += `⏰ *Deadline Reminder*\n\n`
  
  if (schemeTitle) {
    message += `The deadline for your application *${escapeWhatsApp(schemeTitle)}* is approaching!\n\n`
  }
  
  if (deadline) {
    message += `📅 *Deadline:* ${deadline}\n`
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft > 0) {
      message += `⏳ *Days Remaining:* ${daysLeft} days\n`
    } else if (daysLeft === 0) {
      message += `⚠️ *Today is the deadline!*\n`
    } else {
      message += `🚨 *Deadline passed! Please submit ASAP*\n`
    }
  }
  
  if (customMessage) {
    message += `\n${escapeWhatsApp(customMessage)}\n`
  } else {
    message += `\n💡 *Action Required:*\n`
    message += `• Complete the application form\n`
    message += `• Attach all required documents\n`
    message += `• Submit on the official portal\n`
    message += `• Check for confirmation\n`
  }
  
  return message
}

function buildMissingDocsReminder(
  userName?: string,
  schemeTitle?: string,
  missingDocuments: string[] = [],
  customMessage?: string
): string {
  const escapeWhatsApp = (text: string) => (text || '').replace(/[*_~`]/g, '')
  
  let message = `Hello ${escapeWhatsApp(userName || 'User')}! 👋\n\n`
  message += `📄 *Missing Documents Reminder*\n\n`
  
  if (schemeTitle) {
    message += `Some documents are missing for your application *${escapeWhatsApp(schemeTitle)}*.\n\n`
  }
  
  if (missingDocuments.length > 0) {
    message += `📋 *Missing Documents:*\n`
    missingDocuments.forEach((doc, index) => {
      message += `${index + 1}. ${escapeWhatsApp(doc)}\n`
    })
    message += `\n`
  }
  
  if (customMessage) {
    message += `${escapeWhatsApp(customMessage)}\n`
  } else {
    message += `💡 *Next Steps:*\n`
    message += `• Collect the missing documents\n`
    message += `• Scan or photocopy the documents\n`
    message += `• Attach them with your application\n`
    message += `• Submit before the deadline\n`
  }
  
  return message
}

function buildFollowUpReminder(
  userName?: string,
  schemeTitle?: string,
  customMessage?: string
): string {
  const escapeWhatsApp = (text: string) => (text || '').replace(/[*_~`]/g, '')
  
  let message = `Hello ${escapeWhatsApp(userName || 'User')}! 👋\n\n`
  message += `🔔 *Follow-up Reminder*\n\n`
  
  if (schemeTitle) {
    message += `Please check the status of your application *${escapeWhatsApp(schemeTitle)}*.\n\n`
  }
  
  if (customMessage) {
    message += `${escapeWhatsApp(customMessage)}\n`
  } else {
    message += `💡 *Please Check:*\n`
    message += `• Application status\n`
    message += `• Any updates from authorities\n`
    message += `• Confirmation emails/SMS\n`
    message += `• Required follow-up actions\n`
  }
  
  return message
}

