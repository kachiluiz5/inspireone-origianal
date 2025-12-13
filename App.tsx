import React, { useState, useEffect, useRef } from 'react';
import HeroInput from './components/HeroInput';
import InspirationCard from './components/InspirationCard';
import SkeletonCard from './components/SkeletonCard';
import RecentTicker from './components/RecentTicker';
import Avatar from './components/Avatar';
import { Person } from './types';
import { supabase } from './services/supabaseClient';
import { Flame, ChevronRight, X, Download, Loader2, Search, Link as LinkIcon, Share2, AlertCircle, RefreshCw } from 'lucide-react';



const App: React.FC = () => {
    // Data State
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [recentNomination, setRecentNomination] = useState<Person | null>(null);
    const [showAttribution, setShowAttribution] = useState(false);
    const [sharePerson, setSharePerson] = useState<Person | null>(null);
    const [voteSuccessPerson, setVoteSuccessPerson] = useState<Person | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- SUPABASE INTEGRATION ---

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch top 50 from database
            const { data, error: supabaseError } = await supabase
                .from('people')
                .select('*')
                .order('vote_count', { ascending: false })
                .limit(50);

            if (supabaseError) throw supabaseError;

            if (data) {
                // Map snake_case DB columns to camelCase Types
                const mappedPeople: Person[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    handle: p.handle,
                    category: p.category,
                    voteCount: p.vote_count,
                    lastTrend: p.last_trend || 'neutral'
                }));
                setPeople(mappedPeople);
            }
        } catch (err: any) {
            console.error('Failed to fetch leaderboard:', err.message);
            setError(err.message || 'Unable to connect to database. Please check your configuration.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Handle Voting / Adding
    const handleUserInspire = async (newPerson: Omit<Person, 'id' | 'voteCount' | 'lastTrend'>) => {

        // 1. Optimistic UI Update (Instant feedback)
        const optimisticPerson: Person = {
            ...newPerson,
            id: 'temp-' + Date.now(),
            voteCount: 1, // Will be corrected on refetch
            lastTrend: 'up'
        };

        // Show Success Modal immediately
        setVoteSuccessPerson(optimisticPerson);
        setRecentNomination(optimisticPerson);
        setTimeout(() => setRecentNomination(null), 4000);

        // 2. Submit vote to database
        try {
            const { error: rpcError } = await supabase.rpc('vote_for_person', {
                p_handle: newPerson.handle,
                p_name: newPerson.name,
                p_category: newPerson.category
            });

            if (rpcError) {
                console.error("Voting error:", rpcError.message || rpcError);
                setError('Failed to record vote. Please try again.');
            } else {
                // Refetch to get updated leaderboard
                await fetchLeaderboard();
            }

        } catch (err: any) {
            console.error("Unexpected error during voting:", err.message || err);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    // --- END SUPABASE ---

    // Focus search input when modal opens
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);


    // --- PREMIUM LIGHT CARD GENERATOR (SQUARE) ---
    const generateShareImage = async () => {
        if (!sharePerson || !canvasRef.current) return;
        setIsGeneratingImage(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dimensions: Square 1:1 for Social Media
        const width = 1080;
        const height = 1080;
        canvas.width = width;
        canvas.height = height;

        // 1. Background: Clean White/Silver Gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8fafc'); // Slate-50
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Decorative: Subtle Accents (No heavy gradients)
        // Top Bar
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, width, 20);

        // 3. Header Text
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8'; // Slate 400
        ctx.font = '700 32px Inter, sans-serif';
        ctx.letterSpacing = "4px";
        ctx.fillText("WHO INSPIRES YOU?", width / 2, 120);

        // 4. Avatar Loading & Rendering
        const avatarSize = 340;
        const centerX = width / 2;
        const centerY = 340;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://unavatar.io/twitter/${sharePerson.handle}`;

        await new Promise<void>((resolve) => {
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, centerX - avatarSize / 2, centerY - avatarSize / 2, avatarSize, avatarSize);
                ctx.restore();
                // Avatar Inner Border
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
                ctx.lineWidth = 12;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
                // Outer Ring
                ctx.beginPath();
                ctx.arc(centerX, centerY, (avatarSize / 2) + 2, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#e2e8f0';
                ctx.stroke();
                resolve();
            };
            img.onerror = () => {
                // Fallback Initials
                ctx.fillStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 100px Inter, sans-serif';
                ctx.fillText(sharePerson.name.substring(0, 2).toUpperCase(), centerX, centerY + 30);
                resolve();
            }
        });

        // 5. Name
        const textStartY = centerY + (avatarSize / 2) + 80;
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.font = '800 64px Inter, sans-serif';
        ctx.letterSpacing = "-1px";
        ctx.fillText(sharePerson.name, width / 2, textStartY);

        // 6. Handle
        ctx.fillStyle = '#64748b'; // Slate 500
        ctx.font = '500 36px Inter, sans-serif';
        ctx.letterSpacing = "0px";
        ctx.fillText(`@${sharePerson.handle}`, width / 2, textStartY + 60);

        // 7. Divider
        ctx.beginPath();
        ctx.moveTo(width / 2 - 50, textStartY + 110);
        ctx.lineTo(width / 2 + 50, textStartY + 110);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // 8. Vote Count 
        const votesY = textStartY + 230;
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 110px JetBrains Mono, monospace';
        ctx.fillText(sharePerson.voteCount.toLocaleString(), width / 2, votesY);

        // Label "VOTES"
        ctx.fillStyle = '#6366f1'; // Indigo 500
        ctx.font = '700 24px Inter, sans-serif';
        ctx.letterSpacing = "2px";
        ctx.fillText("PEOPLE INSPIRED", width / 2, votesY + 50);

        // 9. Footer - Website URL
        const footerY = height - 60;

        // Pill bg
        const urlText = "inspireone.vercel.app";
        ctx.font = '600 28px Inter, sans-serif';
        const textMetrics = ctx.measureText(urlText);
        const pillWidth = textMetrics.width + 60;
        const pillHeight = 60;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect((width / 2) - (pillWidth / 2), footerY - (pillHeight / 2) - 10, pillWidth, pillHeight, 30);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(urlText, width / 2, footerY);

        setIsGeneratingImage(false);
    };

    useEffect(() => {
        if (sharePerson) {
            generateShareImage();
        }
    }, [sharePerson]);

    const downloadImage = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `inspireone-${sharePerson?.handle}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    // Filter for Leaderboard Search
    const filteredPeople = searchQuery.length > 1
        ? people.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.handle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const topTier = people.slice(0, 3);
    const midTier = people.slice(3);

    return (
        <div className="min-h-screen bg-slate-50 bg-grid-pattern text-slate-900 pb-20">

            {/* --- HEADER --- */}
            <div className="fixed top-4 left-0 right-0 z-40 px-4">
                <header className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg shadow-slate-200/50 rounded-full px-4 h-16 flex items-center justify-between transition-all duration-300">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-2.5 rounded-full shadow-md">
                            <Flame size={20} fill="white" />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search Trigger */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                            aria-label="Search Leaderboard"
                        >
                            <Search size={20} />
                        </button>

                        {/* Attribution/Info */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAttribution(!showAttribution)}
                                className="relative group outline-none focus:outline-none block"
                            >
                                <div className={`transition-all duration-200 ${showAttribution ? 'scale-100 ring-2 ring-offset-2 ring-slate-900 rounded-full' : 'hover:scale-110'}`}>
                                    <Avatar
                                        handle="kachiMbaezue"
                                        name="Creator"
                                        size="sm"
                                        className="border-2 border-white shadow-sm w-9 h-9"
                                    />
                                </div>
                            </button>

                            {showAttribution && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 p-1 animate-in fade-in slide-in-from-top-2 overflow-hidden z-50">
                                    <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">About</p>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs text-slate-500 mb-2 px-2 font-medium">Product designed & built by</p>
                                        <a
                                            href="https://x.com/kachiMbaezue"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg group transition-colors"
                                        >
                                            <Avatar handle="kachiMbaezue" name="Kachi" size="sm" className="w-8 h-8" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-bold text-slate-900 block truncate">@kachiMbaezue</span>
                                                <span className="text-[10px] text-slate-500 block">View Profile</span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </div>

            <main className="w-full max-w-4xl mx-auto pt-32 px-4">

                <HeroInput onInspire={handleUserInspire} />



                <div className="w-full">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                            Top 3 Leaders
                        </h2>
                    </div>

                    {/* SKELETON LOADING STATE */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 bg-red-50 border border-red-100 rounded-2xl">
                            <div className="inline-block p-4 bg-red-100 text-red-500 rounded-full mb-3">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-red-900 mb-1">Unable to load leaderboard</h3>
                            <p className="text-sm text-red-600 mb-4 px-4">{error}</p>
                            <button
                                onClick={fetchLeaderboard}
                                className="px-4 py-2 bg-white border border-red-200 text-red-700 font-bold rounded-lg hover:bg-red-50 flex items-center gap-2 mx-auto"
                            >
                                <RefreshCw size={14} />
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* REAL DATA */}
                            {people.length === 0 ? (
                                <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                                    <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
                                        <AlertCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">No votes yet</h3>
                                    <p className="text-slate-500">Be the first to inspire the world!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                        {topTier.map((p, i) => (
                                            <InspirationCard
                                                key={p.id}
                                                person={p}
                                                rank={i + 1}
                                                onShare={setSharePerson}
                                                onVote={(person) => handleUserInspire({ name: person.name, handle: person.handle, category: person.category })}
                                            />
                                        ))}
                                    </div>

                                    {midTier.length > 0 && (
                                        <>
                                            <div className="flex items-center justify-between mb-4 px-1 border-t border-slate-200 pt-8">
                                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                                    Trending Now
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-12">
                                                {midTier.map((p, i) => (
                                                    <InspirationCard
                                                        key={p.id}
                                                        person={p}
                                                        rank={i + 4}
                                                        onShare={setSharePerson}
                                                        onVote={(person) => handleUserInspire({ name: person.name, handle: person.handle, category: person.category })}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

            </main>

            <RecentTicker recent={recentNomination} />

            {/* --- VOTE SUCCESS MODAL --- */}
            {voteSuccessPerson && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    {/* CSS based confetti dots */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className="absolute animate-fall" style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                                backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                                width: `${6 + Math.random() * 6}px`,
                                height: `${6 + Math.random() * 6}px`,
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                opacity: 0.8
                            }} />
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden transform transition-all animate-pop border border-white/50">
                        <button
                            onClick={() => setVoteSuccessPerson(null)}
                            className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6 flex justify-center relative">
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                                <Avatar handle={voteSuccessPerson.handle} name={voteSuccessPerson.name} size="xl" className="relative z-10 border-4 border-white shadow-xl" />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white z-20 shadow-lg scale-110">
                                    <Flame size={20} fill="currentColor" />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Vote Recorded!</h3>
                        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                            You just cast a vote for <span className="text-slate-900 font-bold">{voteSuccessPerson.name}</span>.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setSharePerson(voteSuccessPerson);
                                    setVoteSuccessPerson(null);
                                }}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Share2 size={18} />
                                Share Card
                            </button>
                            <button
                                onClick={() => setVoteSuccessPerson(null)}
                                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SHARE MODAL --- */}
            {sharePerson && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-200">
                        <button
                            onClick={() => setSharePerson(null)}
                            className="absolute top-3 right-3 bg-slate-100 hover:bg-slate-200 text-slate-500 z-10 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-slate-50 p-6 flex flex-col items-center border-b border-slate-100">
                            <h3 className="text-slate-900 font-bold text-lg mb-4">Your Card is Ready</h3>
                            <div className="relative shadow-xl rounded-xl overflow-hidden border border-slate-200 aspect-square w-full">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full object-contain bg-white"
                                />
                                {isGeneratingImage && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
                                            <span className="text-xs font-bold text-slate-900">Designing...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-white">
                            <button
                                onClick={downloadImage}
                                disabled={isGeneratingImage}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                            >
                                <Download size={24} />
                                Download Image
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                                Perfect for sharing on X (Twitter).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LEADERBOARD SEARCH MODAL --- */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="max-w-2xl mx-auto h-full flex flex-col">
                        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
                            <Search className="text-slate-400 w-6 h-6" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Find someone on the leaderboard..."
                                className="flex-1 text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                            {searchQuery.length < 2 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p>Start typing to search...</p>
                                </div>
                            ) : filteredPeople.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Found {filteredPeople.length} results</p>
                                    {filteredPeople.map((p, i) => (
                                        <InspirationCard
                                            key={p.id}
                                            person={p}
                                            rank={i + 1}
                                            onShare={setSharePerson}
                                            onVote={(person) => handleUserInspire({ name: person.name, handle: person.handle, category: person.category })}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center pt-20">
                                    <p className="text-lg font-bold text-slate-900 mb-2">No one found.</p>
                                    <p className="text-slate-500 mb-6">Looks like "{searchQuery}" isn't on the leaderboard yet.</p>
                                    <button
                                        onClick={() => {
                                            setIsSearchOpen(false);
                                            // The HeroInput is on the main page, so closing search lets them use the main input
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:bg-slate-800 transition-colors"
                                    >
                                        Add them now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
