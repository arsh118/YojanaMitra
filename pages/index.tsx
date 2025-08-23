// pages/index.tsx
import React, { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    setResponse(data);
    setLoading(false);
  }

  return (
    <div style={{padding:20, fontFamily:'Arial, sans-serif'}}>
      <h1>YojanaMitra — Demo</h1>
      <p>Type your profile or paste a transcript (Hindi / English supported).</p>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={6} style={{width:'100%'}} />
      <button onClick={handleSend} disabled={loading} style={{marginTop:10}}>
        {loading ? 'Processing...' : 'Extract Profile'}
      </button>

      <div style={{marginTop:20}}>
        <h3>Response</h3>
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    </div>
  );
}
