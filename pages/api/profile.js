// pages/api/profile.js
import getClient from '../../utils/openaiClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text } = req.body || {};

  if (!text) return res.status(400).json({ error: 'no text provided' });

  // Temporary mock response for testing when OpenAI API key is missing
  if (!process.env.OPENAI_API_KEY) {
    const mockProfile = {
      name: "Arsh",
      age: 19,
      income_annual: 150000,
      domicile_state: "Uttar Pradesh",
      caste_category: "OBC",
      education_level: "BCA",
      disability_flag: false,
      student_flag: true,
      documents_owned: ["marksheet", "aadhar"]
    };
    return res.json({ profile: mockProfile });
  }

  const functions = [
    {
      name: "extract_profile",
      description: "Extract a structured profile from the user text",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          income_annual: { type: "integer" },
          domicile_state: { type: "string" },
          caste_category: { type: "string" },
          education_level: { type: "string" },
          disability_flag: { type: "boolean" },
          student_flag: { type: "boolean" },
          documents_owned: { type: "array", items: { type: "string" } }
        }
      }
    }
  ];

  try {
    const client = await getClient();
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini", // change model if you don't have access
      messages: [
        { role: "system", content: "You extract user profile info into structured JSON and return it via the 'extract_profile' function call only." },
        { role: "user", content: text }
      ],
      functions
    });

    const msg = chat.choices?.[0]?.message;
    if (msg && msg.function_call) {
      const args = JSON.parse(msg.function_call.arguments || "{}");
      return res.json({ profile: args });
    } else {
      // fallback: try to parse assistant content
      return res.json({ raw: msg?.content ?? null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'profile extraction failed' });
  }
}
