import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
// Use server API for AI suggestions/normalization (prevents exposing API keys in the browser)
import { Suggestion, Person } from '../types';
import Avatar from './Avatar';
import ConfirmVoteModal from './ConfirmVoteModal';

interface HeroInputProps {
  onInspire: (person: Omit<Person, 'id' | 'voteCount' | 'lastTrend'>, skipLoading?: boolean) => Promise<void>;
  votedHandles: string[];
}

const PLACEHOLDERS = [
  "e.g. Elon Musk",
  "e.g. @kachiMbaezue",
  "e.g. Taylor Swift",
  "e.g. Jensen Huang",
  "e.g. MKBHD",
  "e.g. Sam Altman"
];

const HeroInput: React.FC<HeroInputProps> = ({ onInspire, votedHandles }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadePlaceholder, setFadePlaceholder] = useState(false);

  // Confirmation Modal State
  const [pendingPerson, setPendingPerson] = useState<{ name: string; handle: string; category: string } | null>(null);

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

  // Debounce logic for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsTyping(true);
        try {
          const resp = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'suggest', query })
          });
          const results = resp.ok ? await resp.json() : [];
          setSuggestions(results);
        } catch (err) {
          console.error('Suggestion fetch failed', err);
          setSuggestions([]);
        }
        setIsTyping(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const textToProcess = manualName || query;
    if (!textToProcess.trim()) return;

    setShowSuggestions(false);

    try {
      let personData;

      try {
        const resp = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'normalize', query: textToProcess, manualName })
        });

        if (resp.ok) {
          const normalized = await resp.json();
          if (normalized) {
            personData = {
              name: normalized.displayName,
              handle: manualHandle || normalized.handle,
              category: normalized.category
            };
          }
        }
      } catch (err) {
        console.error('Normalization failed', err);
      }

      if (!personData) return;

      // Show confirmation modal for direct input (not suggestions)
      if (!skipConfirmation && !manualHandle) {
        setPendingPerson(personData);
        return;
      }

      // Submit vote
      setIsSubmitting(true);
      await onInspire(personData, skipConfirmation); // Skip loading for suggestions
      setQuery('');
    } catch (e) {
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
    } catch (e) {
      console.error("Vote failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (s: Suggestion) => {
    setQuery(s.name);
    handleSubmit(s.name, s.handle, true); // Skip confirmation for suggestions
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-12" ref={wrapperRef}>

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

      {/* Rate Limit Warning */}
      {isRateLimited && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-top-4 font-bold text-sm">
          Whoa! Slow down, you're inspiring too fast. 🚀
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3 transition-all">
          Who inspires you?
        </h1>
        <p className="text-slate-500 text-sm md:text-base font-medium px-4">
          Enter the name or X username of who inspires you.
        </p>
      </div>

      <div className="relative group z-30">
        <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-300 transform focus-within:-translate-y-1">
          <div className="pl-4 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            className={`flex-1 p-4 text-lg text-slate-900 outline-none placeholder:text-slate-300 bg-transparent font-semibold transition-opacity duration-200 ${fadePlaceholder ? 'placeholder:opacity-0' : 'placeholder:opacity-100'}`}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={isSubmitting}
          />

          <div className="pr-2">
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || query.length < 2}
              className={`px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md ${isSubmitting || query.length < 2
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                : 'bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95'
                }`}
            >
              Vote
            </button>
          </div>
        </div>

        {/* Real-time AI Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-100">
              <span>Suggested</span>
              {isTyping && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0 group"
              >
                <Avatar handle={s.handle} name={s.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{s.name}</div>
                  <div className="text-xs text-slate-500 truncate">@{s.handle}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            ))}
          </div>
        )}
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