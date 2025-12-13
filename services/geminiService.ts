import { GoogleGenAI, Type } from "@google/genai";
import { NormalizedPersonResponse, Suggestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash';

/**
 * Normalizes a user input into a standardized person object.
 * Handles misspellings and finds the most likely public handle.
 */
export const normalizePerson = async (input: string): Promise<NormalizedPersonResponse | null> => {
  try {
    // Enhanced prompt for better accuracy
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `You are helping identify a person from user input: "${input}"

Your task:
1. Identify who this person is (could be famous, creator, entrepreneur, artist, athlete, etc.)
2. If it's a misspelling, find the correct person
3. If it's a handle (with or without @), identify the person
4. Return their full name, Twitter/X handle (without @), and category

Categories should be ONE word: Tech, Creator, Artist, Athlete, Business, Music, Science, etc.

IMPORTANT: 
- Be accurate - if unsure, make best guess based on context
- Handle should be their actual Twitter/X username
- If input is clearly a name/handle but not famous, format it nicely anyway

Return JSON with: displayName, handle, category, isValid (true if confident match)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            displayName: { type: Type.STRING },
            handle: { type: Type.STRING },
            category: { type: Type.STRING },
            isValid: { type: Type.BOOLEAN }
          },
        },
      },
    });

    const data = JSON.parse(response.text || '{}');

    // Validation
    if (!data.displayName || !data.handle) return null;

    return {
      displayName: data.displayName,
      handle: data.handle.replace('@', '').trim(),
      category: data.category || 'Creator'
    };

  } catch (error) {
    console.error("Error normalizing person:", error);
    // Fallback logic
    return {
      displayName: input,
      handle: input.replace(/\s+/g, '').replace('@', ''),
      category: 'Community'
    };
  }
};

/**
 * Provides real-time autocomplete suggestions based on partial input.
 * Returns 6 suggestions for better accuracy.
 */
export const getSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (query.length < 2) return [];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `You are helping users find people to vote for. Given the partial input "${query}", suggest 6 real people (famous, creators, entrepreneurs, artists, athletes, etc.) whose names or handles match.

IMPORTANT:
- Prioritize exact matches and close matches first
- Include both very famous and moderately famous people
- If the input looks like a handle (starts with @), match handles
- Return diverse results (different fields/categories)
- Ensure handles are real Twitter/X handles (no @ symbol in response)

Return JSON array: [{name: "Full Name", handle: "twitterhandle"}]`,
      config: {
        responseMimeType: "application/json",
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
    // Return up to 6 suggestions
    return suggestions.slice(0, 6);
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
};