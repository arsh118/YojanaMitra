// pages/api/whisper.js
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'parse error' });
    const file = files.audio;
    if (!file) return res.status(400).json({ error: 'no audio' });

    try {
      const data = fs.readFileSync(file.path);
      // send to OpenAI audio transcription endpoint
      const formData = new FormData();
      formData.append('file', new Blob([data]), 'audio.webm');
      formData.append('model', 'whisper-1');

      const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });
      const j = await r.json();
      res.json({ text: j.text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'transcription failed' });
    }
  });
}
