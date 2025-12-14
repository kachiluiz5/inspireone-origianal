import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Person } from '../types';
import ConfirmVoteModal from './ConfirmVoteModal';
import { normalizePerson } from '../services/geminiService';

interface HeroInputProps {
  onInspire: (person: Omit<Person, 'id' | 'voteCount' | 'lastTrend'>, skipLoading?: boolean) => Promise<void>;
  votedHandles: string[];
}

const PLACEHOLDERS = [
  "e.g. @elonmusk",
  "e.g. @kachiMbaezue",
  "e.g. @taylorswift13",
  "e.g. @JensenHuang",
  "e.g. @mkbhd",
  "e.g. @sama"
];

const HeroInput: React.FC<HeroInputProps> = ({ onInspire, votedHandles }) => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadePlaceholder, setFadePlaceholder] = useState(false);

  // Confirmation Modal State
  const [pendingPerson, setPendingPerson] = useState<{ name: string; handle: string; category: string } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Bot Protection State
  const [honeypot, setHoneypot] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dynamic Placeholder Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setFadePlaceholder(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setFadePlaceholder(false);
      }, 200); // Wait for fade out
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const checkBotProtection = (): boolean => {
    // 1. Honeypot Check (Hidden field that simple bots might fill)
    if (honeypot) {
      console.warn("Bot detected: Honeypot filled");
      return false;
    }

    // 2. Rate Limiting
    const lastVoteTime = localStorage.getItem('inspire_last_vote_time');
    const now = Date.now();
    const COOLDOWN_MS = 10000; // 10 seconds cooldown between votes

    if (lastVoteTime && now - parseInt(lastVoteTime) < COOLDOWN_MS) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 3000); // Clear error after 3s
      return false;
    }

    localStorage.setItem('inspire_last_vote_time', now.toString());
    return true;
  };

  const handleSubmit = async (manualName?: string, manualHandle?: string, skipConfirmation = false) => {
    // Bot/Spam Check
    if (!checkBotProtection()) {
      return;
    }
    setError(null);


    const textToProcess = manualName || query;
    if (!textToProcess.trim()) return;

    try {
      let personData;

      try {
        const normalized = await normalizePerson(textToProcess);
        if (normalized && normalized.displayName && normalized.handle) {
          personData = {
            name: normalized.displayName,
            handle: (manualHandle || normalized.handle).replace(/^@/, ''),
            category: normalized.category
          };
        }
      } catch (err) {
        // Service unavailable - will use fallback from normalizePerson
      }

      // Fallback: If normalization fails, create person data from user input
      if (!personData) {
        const cleanInput = textToProcess.trim();
        // Extract handle if it starts with @
        const extractedHandle = cleanInput.startsWith('@')
          ? cleanInput.slice(1).trim()
          : cleanInput.replace(/\s+/g, '').toLowerCase();

        // Use manual handle if provided, otherwise use extracted handle
        const finalHandle = manualHandle || extractedHandle;

        // Format name nicely (capitalize words)
        const formattedName = cleanInput
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .replace('@', '');

        personData = {
          name: formattedName,
          handle: finalHandle,
          category: 'Creator' // Default category
        };
      }

      // Show confirmation modal for direct input (not suggestions)
      if (!skipConfirmation && !manualHandle) {
        setPendingPerson(personData);
        return;
      }

      // Submit vote
      setIsSubmitting(true);
      await onInspire(personData, skipConfirmation); // Skip loading for suggestions
      setQuery('');
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      console.error("Submission failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVote = async () => {
    if (!pendingPerson) return;

    setIsSubmitting(true);
    setPendingPerson(null);

    try {
      await onInspire(pendingPerson, false); // Show loading for confirmed votes
      setQuery('');
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      console.error("Vote failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8 md:mb-12" ref={wrapperRef}>

      {/* Hidden Honeypot Field for Bots */}
      <input
        type="text"
        name="website_url_confirm"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: 'absolute', opacity: 0, top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Full Screen Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 text-slate-900 animate-spin relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Searching the Universe...</h3>
          <p className="text-slate-500 font-medium">Finding {query}...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-top-4 font-bold text-sm">
          {error}
        </div>
      )}

      {/* Rate Limit Warning */}
      {isRateLimited && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-top-4 font-bold text-sm">
          Whoa! Slow down, you're inspiring too fast. 🚀
        </div>
      )}

      <div className="text-center mb-6 md:mb-8 px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-2 md:mb-3 transition-all">
          Who inspires you?
        </h1>
        <p className="text-slate-500 text-xs md:text-sm lg:text-base font-medium">
          Enter the X username (e.g. @username) of who inspires you.
        </p>
      </div>

      <div className="relative group z-30">
        <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-300 md:focus-within:-translate-y-1 overflow-hidden">
          <div className="pl-3 md:pl-4 text-slate-400 flex-shrink-0">
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            className={`flex-1 p-3 md:p-4 text-base md:text-lg text-slate-900 outline-none placeholder:text-slate-300 bg-transparent font-semibold transition-opacity duration-200 min-w-0 ${fadePlaceholder ? 'placeholder:opacity-0' : 'placeholder:opacity-100'}`}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={isSubmitting}
          />

          <div className="pr-2 md:pr-3 flex-shrink-0">
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || query.length < 2}
              className={`px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-white transition-all shadow-md whitespace-nowrap ${isSubmitting || query.length < 2
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                : 'bg-slate-900 hover:bg-slate-800 active:scale-95 md:hover:scale-105'
                }`}
            >
              Vote
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingPerson && (
        <ConfirmVoteModal
          person={pendingPerson}
          onConfirm={handleConfirmVote}
          onCancel={() => setPendingPerson(null)}
        />
      )}
    </div>
  );
};

export default HeroInput;