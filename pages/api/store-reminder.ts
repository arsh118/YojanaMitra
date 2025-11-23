// pages/api/store-reminder.ts
// Store reminder schedule for n8n to process
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface ReminderSchedule {
  id: string
  phone: string
  userName?: string
  schemeTitle?: string
  reminderType: 'deadline' | 'missing_docs' | 'follow_up' | 'custom'
  deadline?: string
  missingDocuments?: string[]
  scheduledDate: string
  message?: string
  customData?: any
  status: 'pending' | 'sent' | 'failed'
  createdAt: string
}

const REMINDERS_FILE = path.join(process.cwd(), 'data', 'reminders.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load reminders from file
function loadReminders(): ReminderSchedule[] {
  ensureDataDir()
  if (!fs.existsSync(REMINDERS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(REMINDERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('[store-reminder] Error loading reminders:', err)
    return []
  }
}

// Save reminders to file
function saveReminders(reminders: ReminderSchedule[]) {
  ensureDataDir()
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Store a new reminder
    const {
      phone,
      userName,
      schemeTitle,
      reminderType,
      deadline,
      missingDocuments,
      scheduledDate,
      message,
      customData
    } = req.body

    if (!phone || !scheduledDate) {
      return res.status(400).json({
        error: 'Phone number and scheduled date are required'
      })
    }

    const reminder: ReminderSchedule = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      userName,
      schemeTitle,
      reminderType: reminderType || 'custom',
      deadline,
      missingDocuments,
      scheduledDate,
      message,
      customData,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const reminders = loadReminders()
    reminders.push(reminder)
    saveReminders(reminders)

    console.log('[store-reminder] Stored reminder:', reminder.id)
    return res.status(200).json({
      success: true,
      reminderId: reminder.id,
      reminder
    })

  } else if (req.method === 'GET') {
    // Get pending reminders (for n8n to process)
    const { status, beforeDate } = req.query

    let reminders = loadReminders()

    // Filter by status
    if (status) {
      reminders = reminders.filter(r => r.status === status)
    }

    // Filter by date (get reminders scheduled before this date)
    if (beforeDate) {
      const before = new Date(beforeDate as string)
      reminders = reminders.filter(r => new Date(r.scheduledDate) <= before)
    }

    return res.status(200).json({
      success: true,
      count: reminders.length,
      reminders
    })

  } else if (req.method === 'PUT') {
    // Update reminder status
    const { reminderId, status } = req.body

    if (!reminderId || !status) {
      return res.status(400).json({
        error: 'Reminder ID and status are required'
      })
    }

    const reminders = loadReminders()
    const index = reminders.findIndex(r => r.id === reminderId)

    if (index === -1) {
      return res.status(404).json({
        error: 'Reminder not found'
      })
    }

    reminders[index].status = status
    saveReminders(reminders)

    return res.status(200).json({
      success: true,
      reminder: reminders[index]
    })

  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}



