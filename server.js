const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.use(express.static(path.join(__dirname)));

// AI API endpoint
app.post('/api/ia', async (req, res) => {
  try {
    const { apiKey, action, text, prompt } = req.body;
    
    console.log('[AI API] Request received:', { 
      action, 
      textLength: text?.length || 0, 
      hasApiKey: !!apiKey,
      prompt: prompt?.substring(0, 100) + '...' 
    });

    // If no API key provided, use local heuristic
    if (!apiKey || apiKey.trim() === '') {
      console.log('[AI API] No API key provided, using local heuristic');
      const result = localHeuristic(action, prompt, text);
      return res.json({ output: result });
    }

    // Try to use OpenAI API (you can replace this with other AI services)
    try {
      const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant spécialisé dans la rédaction de CV et lettres de motivation. Action demandée: ${action}. Consignes: ${prompt}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiOutput = openaiResponse.data.choices[0]?.message?.content || text;
      console.log('[AI API] OpenAI response received, length:', aiOutput.length);
      
      res.json({ output: aiOutput });
    } catch (aiError) {
      console.error('[AI API] OpenAI API error:', aiError.response?.data || aiError.message);
      
      // Fallback to local heuristic if AI API fails
      console.log('[AI API] Falling back to local heuristic');
      const result = localHeuristic(action, prompt, text);
      res.json({ output: result });
    }

  } catch (error) {
    console.error('[AI API] Server error:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
});

// Local heuristic function (same as in ai.js)
function localHeuristic(action, prompt, text) {
  console.log('[AI API] Using local heuristic for action:', action);
  
  if (action === 'summarize') { 
    return text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' '); 
  }
  if (action === 'expand') { 
    return text + '\n\nDétails: contexte, actions, résultats (KPI).'; 
  }
  if (action === 'bulletify') { 
    return text.split(/[\n\.]/).map(t => t.trim()).filter(Boolean).slice(0, 8).map(x => '• ' + x[0].toUpperCase() + x.slice(1)).join('\n'); 
  }
  if (action === 'achievements') { 
    return text.split(/[\n\.]/).map(t => t.trim()).filter(Boolean).slice(0, 6).map((x, i) => `• ${x} — KPI +${10 + i * 5}%`).join('\n'); 
  }
  if (action === 'rewrite') {
    let out = text.replace(/\b(très|vraiment|beaucoup)\b/gi, '');
    if (/impactant|percutant|dynamique/i.test(prompt)) out = out.replace(/\b(responsable|chargé de)\b/gi, 'Pilotage');
    if (/court|concise/i.test(prompt)) out = out.slice(0, 600);
    return out;
  }
  if (action === 'ats') { 
    const m = prompt.match(/Inclure:(.*?)\|/i); 
    const kws = m ? m[1].split(',').map(s => s.trim()).filter(Boolean) : []; 
    return (text + '\n\nMots-clés intégrés: ' + kws.join(', ')).trim(); 
  }
  if (action === 'email') { 
    return `Objet: Candidature — [Poste]\n\nMadame, Monsieur,\nJe vous propose ma candidature au poste de [Poste]. Expériences clés: [3 bullets].\nCordialement,\nPrénom NOM — Tél · Email · LinkedIn`; 
  }
  if (action === 'lm') { 
    return `Madame, Monsieur,\nVotre besoin correspond à mon parcours. Résultats: [KPI].\nDisponible pour un entretien.\nCordialement,\nPrénom NOM`; 
  }
  if (action === 'translate') { 
    if (/\b(en)\b/i.test(prompt)) return '[EN] ' + text; 
    return '[FR] ' + text; 
  }
  if (action === 'tagline') { 
    return 'Chef de projet — 8+ ans, livraisons TCE, performance et qualité.'; 
  }
  return text;
}

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 CV Creator server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🤖 AI API endpoint available at: http://localhost:${PORT}/api/ia`);
});