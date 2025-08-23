// utils/openaiClient.js
let client = null;

async function getClient() {
  if (!client) {
    const { OpenAI } = await import('openai/index.js');
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return client;
}

export default getClient;
