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
    // Optimized prompt: Shorter, allows non-famous people if handle is likely, faster processing.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `User input: "${input}". 
      Task: Identify the person.
      1. If they are famous, return their name/handle/category.
      2. If not famous but input looks like a name or handle, format it nicely.
      3. Category should be 1 word (e.g. Creator, Tech, Art).
      4. Handle should NOT include @.
      Return JSON.`,
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
    
    // Looser validation to allow local heroes/non-famous people
    if (!data.displayName || !data.handle) return null;

    return {
      displayName: data.displayName,
      handle: data.handle.replace('@', '').trim(),
      category: data.category || 'Creator'
    };

  } catch (error) {
    console.error("Error normalizing person:", error);
    // Strong fallback logic
    return {
      displayName: input,
      handle: input.replace(/\s+/g, ''),
      category: 'Community'
    };
  }
};

/**
 * Provides real-time autocomplete suggestions based on partial input.
 */
export const getSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (query.length < 2) return [];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `List 3 people (famous or creators) matching "${query}". JSON Array: [{name, handle}].`,
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
    return suggestions;
  } catch (error) {
    return [];
  }
};