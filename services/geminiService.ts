import { NormalizedPersonResponse, Suggestion } from '../types';

// This service now uses the server-side API route (/api/gemini) to keep API keys secure
// The API key is NEVER exposed to the client-side code

/**
 * Normalizes a user input into a standardized person object.
 * Handles misspellings and finds the most likely public handle.
 */
export const normalizePerson = async (input: string): Promise<NormalizedPersonResponse | null> => {
  try {
    // Use server-side API route to keep API key secure
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'normalize', query: input })
    });

    if (resp.ok) {
      const normalized = await resp.json();
      if (normalized && normalized.displayName && normalized.handle) {
        return {
          displayName: normalized.displayName,
          handle: normalized.handle,
          category: normalized.category || 'Creator'
        };
      }
    }
  } catch (error) {
    // API unavailable - will use fallback
  }

  // Fallback: Create person data from user input when API is unavailable
  const cleanInput = input.trim();
  const extractedHandle = cleanInput.startsWith('@') 
    ? cleanInput.slice(1).trim()
    : cleanInput.replace(/\s+/g, '').toLowerCase();
  
  const formattedName = cleanInput
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace('@', '');

  return {
    displayName: formattedName,
    handle: extractedHandle,
    category: 'Creator'
  };
};

/**
 * Provides real-time autocomplete suggestions based on partial input.
 * Returns 6 suggestions for better accuracy.
 */
export const getSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (query.length < 2) return [];

  try {
    // Use server-side API route to keep API key secure
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggest', query })
    });

    if (resp.ok) {
      const results = await resp.json();
      return Array.isArray(results) ? results : [];
    }
  } catch (error) {
    // API unavailable - return empty suggestions
  }

  return [];
};