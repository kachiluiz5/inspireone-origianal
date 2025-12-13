import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// Create server-side client using environment variable set in Vercel project settings
const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn('API key for Google GenAI is not set. Set `API_KEY` in environment.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ai) return res.status(500).json({ error: 'Server misconfiguration: missing API key' });

  const { action, query, manualName } = req.body || {};

  try {
    if (action === 'suggest') {
      if (!query || query.length < 2) return res.json([]);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are helping users find people to vote for. Given the partial input "${query}", suggest 6 real people (famous, creators, entrepreneurs, artists, athletes, etc.) whose names or handles match.\n\nReturn JSON array: [{name: "Full Name", handle: "twitterhandle"}]`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                handle: { type: Type.STRING }
              }
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text || '[]');
      return res.json(suggestions.slice(0, 6));
    }

    if (action === 'normalize') {
      const input = manualName || query || '';
      if (!input) return res.status(400).json({ error: 'Missing input' });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are helping identify a person from user input: "${input}"\n\nReturn JSON with: displayName, handle, category, isValid`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              displayName: { type: Type.STRING },
              handle: { type: Type.STRING },
              category: { type: Type.STRING },
              isValid: { type: Type.BOOLEAN }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (!data.displayName || !data.handle) return res.json(null);
      return res.json({ displayName: data.displayName, handle: (data.handle || '').replace('@', '').trim(), category: data.category || 'Creator', isValid: !!data.isValid });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Gemini API error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
