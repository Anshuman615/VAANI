// Vercel Serverless Function: /api/generate
// Calls Gemini API (key stays server-side via env var) to generate a Duolingo-style
// mini lesson (8 word/phrase pairs) for any language + topic requested by the user.
//
// Required env var on Vercel: GEMINI_API_KEY  (free tier key from https://aistudio.google.com/apikey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server missing GEMINI_API_KEY. Add it in Vercel project settings.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const language = (body?.language || '').toString().trim().slice(0, 60);
  const topic = (body?.topic || 'Greetings & Basics').toString().trim().slice(0, 80);

  if (!language) {
    res.status(400).json({ error: 'Language is required' });
    return;
  }

  const prompt = `You are a language-lesson content generator for a Duolingo-style app.
Generate exactly 8 useful, beginner-friendly English-to-"${language}" word/phrase pairs on the topic: "${topic}".

Respond with ONLY raw JSON (no markdown fences, no preamble, no explanation) in exactly this shape:
{"items":[{"english":"Hello","native":"...","transliteration":"..."}]}

Rules:
- "native" must be written in the ${language} script/spelling as a native speaker would write it.
- "transliteration" is a simple Latin-alphabet phonetic guide for pronunciation. If ${language} already uses the Latin alphabet, set "transliteration" to an empty string "".
- Keep entries short (single words or short common phrases), accurate, and appropriate for absolute beginners.
- Return exactly 8 items, no duplicates.
- Output must be valid JSON parseable by JSON.parse with no trailing commas.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.status(502).json({ error: `Gemini API error: ${errText.slice(0, 300)}` });
      return;
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      res.status(502).json({ error: 'Empty response from Gemini' });
      return;
    }

    let cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: 'Could not parse lesson content. Please try again.' });
      return;
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      res.status(502).json({ error: 'Malformed lesson content. Please try again.' });
      return;
    }

    const items = parsed.items
      .filter(it => it && it.english && it.native)
      .slice(0, 8)
      .map(it => ({
        english: String(it.english).slice(0, 100),
        native: String(it.native).slice(0, 100),
        transliteration: it.transliteration ? String(it.transliteration).slice(0, 100) : '',
      }));

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Server error generating lesson: ' + (err.message || 'unknown') });
  }
}