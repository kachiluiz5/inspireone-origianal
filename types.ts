export interface Person {
  id: string;
  name: string;
  handle: string; // Twitter/X handle or similar
  category: string;
  voteCount: number;
  lastTrend: 'up' | 'down' | 'neutral';
}

export interface Suggestion {
  name: string;
  handle: string;
}

export interface NormalizedPersonResponse {
  displayName: string;
  handle: string;
  category: string;
}