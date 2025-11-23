# n8n Workflow Debug Guide - Code Node Not Working

## Problem
Workflow stops after "Has Reminders?" and Code node, doesn't continue to "Send WhatsApp Reminder"

## Debug Steps

### Step 1: Check "Get Pending Reminders" Output

1. Click on "Get Pending Reminders" node
2. Click "Execute Node" to test
3. Check the output - should see:
```json
{
  "success": true,
  "count": 2,
  "reminders": [
    {
      "id": "rem_123...",
      "phone": "7819849984",
      "userName": "John",
      ...
    }
  ]
}
```

**If you see this, the API is working! ✅**

### Step 2: Check "Has Reminders?" Condition

1. Click on "Has Reminders?" node
2. Check the condition: `{{$json.count}} > 0`
3. Execute and check:
   - If count > 0, should go to TRUE branch ✅
   - If count = 0, goes to FALSE branch (stops)

**Make sure TRUE branch is connected to Code node!**

### Step 3: Fix Code Node

Replace the Code node code with this **improved version**:

```javascript
// Get the input data
const inputData = $input.all();

// Process each input item
const results = [];

for (const item of inputData) {
  const response = item.json;
  
  // Check if response has reminders array
  if (response && response.reminders && Array.isArray(response.reminders)) {
    const reminders = response.reminders;
    
    // Log for debugging
    console.log('Found reminders:', reminders.length);
    
    // Process each reminder
    for (const reminder of reminders) {
      results.push({
        json: {
          id: reminder.id,
          phone: reminder.phone,
          userName: reminder.userName,
          schemeTitle: reminder.schemeTitle,
          reminderType: reminder.reminderType,
          deadline: reminder.deadline,
          missingDocuments: reminder.missingDocuments,
          message: reminder.message,
          customData: reminder.customData
        }
      });
    }
  } else {
    console.log('No reminders array found in response:', response);
  }
}

// Return results
if (results.length === 0) {
  console.log('No reminders to process');
  return [];
}

console.log('Returning', results.length, 'reminders');
return results;
```

### Step 4: Check Code Node Output

1. Click on Code node
2. Click "Execute Node"
3. Check output - should show multiple items (one per reminder)
4. Each item should have: `id`, `phone`, `userName`, etc.

**If you see items here, Code node is working! ✅**

### Step 5: Check Connections

Make sure connections are:
```
Has Reminders? (TRUE) → Process Reminders (Code)
Process Reminders (Code) → Send WhatsApp Reminder
Send WhatsApp Reminder → Sent Successfully?
Sent Successfully? (TRUE) → Mark as Sent
Sent Successfully? (FALSE) → Mark as Failed
```

### Step 6: Test "Send WhatsApp Reminder" Input

1. Click on "Send WhatsApp Reminder" node
2. Check "Input" tab
3. Should see individual reminder data (not the array)

If input is empty or wrong, the Code node isn't outputting correctly.

## Alternative: Use Split Out Node Instead of Code

If Code node keeps failing, use this simpler approach:

### Option A: Split Out Node

1. **Delete Code node**
2. **Add "Split Out" node** after "Has Reminders?"
3. Configure:
   - **Field to Split Out**: `reminders`
4. Connect: Has Reminders? (TRUE) → Split Out → Send WhatsApp Reminder

This is simpler and more reliable!

## Quick Fix: Complete Workflow Structure

```
[Get Pending Reminders]
         ↓
[Has Reminders?] (count > 0)
    TRUE ↓ FALSE
         ↓ (stop)
[Split Out] (field: reminders) ← Use this instead of Code!
         ↓
[Send WhatsApp Reminder]
         ↓
[Sent Successfully?]
    TRUE ↓ FALSE
         ↓
[Mark as Sent]  [Mark as Failed]
```

## Test the API Directly

```bash
curl "http://localhost:3002/api/store-reminder?status=pending&beforeDate=2025-12-31T23:59:59Z"
```

Should return:
```json
{
  "success": true,
  "count": 1,
  "reminders": [
    {
      "id": "rem_...",
      "phone": "7819849984",
      ...
    }
  ]
}
```

## Common Issues

### Issue 1: Code node returns empty array
**Cause**: No reminders in response or wrong data structure
**Fix**: Check "Get Pending Reminders" output first

### Issue 2: Code node has error
**Cause**: Syntax error or wrong variable names
**Fix**: Use the improved Code node code above

### Issue 3: Connection missing
**Cause**: Code node not connected to "Send WhatsApp Reminder"
**Fix**: Draw connection from Code node output → Send WhatsApp Reminder input

### Issue 4: Code node output format wrong
**Cause**: Not returning array of items
**Fix**: Make sure Code node returns: `[{ json: {...} }, { json: {...} }]`

## Recommended: Use Split Out Instead

**Easiest solution** - Replace Code node with Split Out:

1. Delete "Process Reminders" (Code node)
2. Add "Split Out" node
3. Set "Field to Split Out" = `reminders`
4. Connect: Has Reminders? (TRUE) → Split Out → Send WhatsApp Reminder

This is more reliable and easier to debug!



