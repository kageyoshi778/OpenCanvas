import React, { useState } from 'react';
import axios from 'axios';

function Prompt() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState('');

  const sendPrompt = async () => {
  if (!prompt.trim()) return;
  setLoading(true);
  setAiReply('');

  try {
    const response = await axios.post('http://localhost:5000/generate', { prompt });
    const aiText = response.data.reply;
    setAiReply(aiText);
    setPrompt('');
    setLoading(false);

    // Clean markdown formatting
    try {
      const cleaned = aiText
        .replace(/```json\s*|```/gi, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Dispatch if it has a 'type' field (like draw_rectangle, draw_circle, etc.)
      if (parsed.action === 'draw' && parsed.shape) {
          const mapped = {
            type: `draw_${parsed.shape}`,
            ...parsed
    };
      window.dispatchEvent(new CustomEvent('ai-action', { detail: mapped }));
    
      } else {
        console.warn('Parsed JSON missing "type" field');
      }
    } catch (err) {
      console.warn('AI response is not valid JSON:', err.message);
    }

  } catch (err) {
    console.error(err);
    setAiReply('Error: Could not get response from AI.');
    setLoading(false);
  }
};

  return (
    <div style={{ marginTop: '20px' }}>
      <textarea
        placeholder="Ask the AI to draw something..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />
      <button onClick={sendPrompt} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Generating...' : 'Send'}
      </button>

      {aiReply && (
        <div style={{ marginTop: '10px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <strong>AI Response:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{aiReply}</pre>
        </div>
      )}
    </div>
  );
}

export default Prompt;
