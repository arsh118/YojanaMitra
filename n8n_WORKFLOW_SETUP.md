# n8n Workflow Setup for Smart Reminders

This guide shows you how to set up n8n automations to send deadline reminders and follow-ups via WhatsApp/SMS.

## Prerequisites

1. **n8n installed** (cloud or self-hosted)
   - Cloud: https://n8n.io (free tier available)
   - Self-hosted: `npm install -g n8n`

2. **YojanaMitra API running** (your Next.js app)

3. **Twilio configured** (for WhatsApp/SMS sending)

## API Endpoints

### 1. Store Reminder Schedule
**POST** `/api/store-reminder`

Stores a reminder schedule for later processing.

**Request Body:**
```json
{
  "phone": "7819849984",
  "userName": "John Doe",
  "schemeTitle": "PM YASASVI Scholarship",
  "reminderType": "deadline",
  "deadline": "2025-12-31",
  "scheduledDate": "2025-12-25T10:00:00Z",
  "message": "Custom reminder message (optional)"
}
```

**Reminder Types:**
- `deadline` - Deadline reminder
- `missing_docs` - Missing documents reminder
- `follow_up` - Follow-up reminder
- `custom` - Custom message

### 2. Get Pending Reminders
**GET** `/api/store-reminder?status=pending&beforeDate=2025-12-31T23:59:59Z`

Gets reminders that need to be sent.

### 3. Send Reminder (n8n Webhook)
**POST** `/api/n8n-reminder`

Sends a reminder via WhatsApp. This is the endpoint n8n calls.

**Request Body:**
```json
{
  "phone": "7819849984",
  "userName": "John Doe",
  "schemeTitle": "PM YASASVI Scholarship",
  "reminderType": "deadline",
  "deadline": "2025-12-31",
  "message": "Custom message (optional)"
}
```

**Query Params (alternative):**
```
?phone=7819849984&reminderType=deadline&deadline=2025-12-31
```

### 4. Update Reminder Status
**PUT** `/api/store-reminder`

Updates reminder status after sending.

**Request Body:**
```json
{
  "reminderId": "rem_1234567890_abc",
  "status": "sent"
}
```

## n8n Workflow Examples

### Workflow 1: Daily Deadline Reminder Check

**Trigger:** Cron (runs daily at 9 AM)

**Nodes:**
1. **Cron** - Schedule: `0 9 * * *` (9 AM daily)
2. **HTTP Request** - GET pending reminders
   - URL: `http://localhost:3000/api/store-reminder?status=pending&beforeDate={{$now}}`
   - Method: GET
3. **Split In Batches** - Process each reminder
4. **HTTP Request** - Send reminder
   - URL: `http://localhost:3000/api/n8n-reminder`
   - Method: POST
   - Body:
     ```json
     {
       "phone": "{{$json.phone}}",
       "userName": "{{$json.userName}}",
       "schemeTitle": "{{$json.schemeTitle}}",
       "reminderType": "{{$json.reminderType}}",
       "deadline": "{{$json.deadline}}",
       "message": "{{$json.message}}"
     }
     ```
5. **IF** - Check if sent successfully
   - Condition: `{{$json.success}} === true`
6. **HTTP Request** - Update status to "sent"
   - URL: `http://localhost:3000/api/store-reminder`
   - Method: PUT
   - Body:
     ```json
     {
       "reminderId": "{{$('HTTP Request').item.json.id}}",
       "status": "sent"
     }
     ```
7. **HTTP Request** - Update status to "failed" (if error)
   - Same as above but status: "failed"

### Workflow 2: Missing Documents Reminder

**Trigger:** Webhook (called when documents are missing)

**Nodes:**
1. **Webhook** - Receive trigger
   - Path: `/missing-docs-reminder`
2. **HTTP Request** - Send reminder
   - URL: `http://localhost:3000/api/n8n-reminder`
   - Method: POST
   - Body:
     ```json
     {
       "phone": "{{$json.phone}}",
       "userName": "{{$json.userName}}",
       "schemeTitle": "{{$json.schemeTitle}}",
       "reminderType": "missing_docs",
       "missingDocuments": "{{$json.missingDocuments}}",
       "message": "Please submit the missing documents"
     }
     ```

### Workflow 3: Follow-up Reminder (Weekly)

**Trigger:** Cron (runs weekly)

**Nodes:**
1. **Cron** - Schedule: `0 10 * * 1` (Monday 10 AM)
2. **HTTP Request** - Get applications needing follow-up
   - Your custom logic to identify applications
3. **HTTP Request** - Send follow-up reminder
   - URL: `http://localhost:3000/api/n8n-reminder`
   - Method: POST
   - Body:
     ```json
     {
       "phone": "{{$json.phone}}",
       "reminderType": "follow_up",
       "message": "Please check your application status"
     }
     ```

## Complete n8n Workflow JSON

Save this as `deadline-reminder-workflow.json` and import into n8n:

```json
{
  "name": "YojanaMitra Deadline Reminders",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 24
            }
          ]
        }
      },
      "id": "cron-trigger",
      "name": "Daily Check",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3000/api/store-reminder",
        "options": {
          "queryParameters": {
            "parameters": [
              {
                "name": "status",
                "value": "pending"
              },
              {
                "name": "beforeDate",
                "value": "={{$now}}"
              }
            ]
          }
        }
      },
      "id": "get-reminders",
      "name": "Get Pending Reminders",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3000/api/n8n-reminder",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{{\n  \"phone\": $json.phone,\n  \"userName\": $json.userName,\n  \"schemeTitle\": $json.schemeTitle,\n  \"reminderType\": $json.reminderType,\n  \"deadline\": $json.deadline,\n  \"message\": $json.message\n}}}",
        "options": {}
      },
      "id": "send-reminder",
      "name": "Send Reminder",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Daily Check": {
      "main": [[{"node": "Get Pending Reminders", "type": "main", "index": 0}]]
    },
    "Get Pending Reminders": {
      "main": [[{"node": "Send Reminder", "type": "main", "index": 0}]]
    }
  }
}
```

## Testing

### Test Store Reminder
```bash
curl -X POST http://localhost:3000/api/store-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "7819849984",
    "userName": "Test User",
    "schemeTitle": "Test Scheme",
    "reminderType": "deadline",
    "deadline": "2025-12-31",
    "scheduledDate": "2025-12-25T10:00:00Z"
  }'
```

### Test Send Reminder
```bash
curl -X POST http://localhost:3000/api/n8n-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "7819849984",
    "userName": "Test User",
    "schemeTitle": "Test Scheme",
    "reminderType": "deadline",
    "deadline": "2025-12-31"
  }'
```

## Integration with Application Flow

When a user completes an application, you can store reminders:

```javascript
// After kit download
await fetch('/api/store-reminder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: profile.phone,
    userName: profile.name,
    schemeTitle: selectedScheme.scheme.title,
    reminderType: 'deadline',
    deadline: '2025-12-31', // Get from scheme data
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days before
  })
})
```

## Production Setup

1. **Update API URLs** in n8n workflows to your production domain
2. **Set up authentication** if needed (API keys, etc.)
3. **Monitor reminders** - Check `/api/store-reminder?status=sent` for sent reminders
4. **Error handling** - Set up alerts for failed reminders

## Next Steps

1. Import workflows into n8n
2. Configure cron schedules
3. Test with sample data
4. Integrate reminder storage into application flow
5. Monitor and adjust as needed



