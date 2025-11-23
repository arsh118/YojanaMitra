// Improved Code Node for n8n - Copy this into your Code node
// This handles the API response structure correctly

// Get all input items
const inputData = $input.all();

// Array to store processed reminders
const results = [];

// Process each input item
for (const item of inputData) {
  const response = item.json;
  
  // Debug: Log what we received
  console.log('Processing response:', JSON.stringify(response, null, 2));
  
  // Check if response has the expected structure
  if (!response) {
    console.log('No response data');
    continue;
  }
  
  // Check if reminders array exists
  if (response.reminders && Array.isArray(response.reminders)) {
    const reminders = response.reminders;
    console.log(`Found ${reminders.length} reminders to process`);
    
    // Process each reminder
    for (const reminder of reminders) {
      // Create output item with all reminder fields
      results.push({
        json: {
          id: reminder.id || '',
          phone: reminder.phone || '',
          userName: reminder.userName || '',
          schemeTitle: reminder.schemeTitle || '',
          reminderType: reminder.reminderType || 'custom',
          deadline: reminder.deadline || '',
          missingDocuments: reminder.missingDocuments || [],
          message: reminder.message || '',
          customData: reminder.customData || {}
        }
      });
    }
  } else {
    console.log('No reminders array found. Response structure:', Object.keys(response));
    // If response is already a reminder object (not wrapped in array)
    if (response.id && response.phone) {
      results.push({
        json: response
      });
    }
  }
}

// Log final results
console.log(`Returning ${results.length} reminder items`);

// Return results - n8n expects array of items
if (results.length === 0) {
  console.log('WARNING: No reminders to process!');
  // Return empty array - workflow will stop
  return [];
}

return results;



