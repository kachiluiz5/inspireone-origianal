import React, { useState } from 'react';
import { Person } from '../types';
import Avatar from './Avatar';
import { TrendingUp, Share2, ChevronDown, Crown, ThumbsUp } from 'lucide-react';

interface InspirationCardProps {
  person: Person;
  rank: number;
  isNew?: boolean;
  onShare: (person: Person) => void;
  onVote: (person: Person) => void;
}

// X (Twitter) Icon Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InspirationCard: React.FC<InspirationCardProps> = ({ person, rank, isNew, onShare, onVote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isTop3 = rank <= 3;
  const isRank1 = rank === 1;

  return (
    <div className="flex flex-col relative group/card">
      
      {/* Animated Gold Border Background for Rank 1 */}
      {isRank1 && (
         <div className="absolute -inset-[3px] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 rounded-xl blur-[1px] animate-gradient-border pointer-events-none opacity-100" />
      )}

      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative z-10 flex items-center gap-4 bg-white border p-3 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer 
          ${isNew ? 'bg-blue-50/50 border-blue-200' : 'border-slate-200'} 
          ${isExpanded ? 'rounded-b-none border-b-0 shadow-sm' : ''}
          ${isRank1 ? 'border-transparent bg-white/95 backdrop-blur-sm' : 'hover:border-slate-300'}
        `}
      >
        {/* Rank Indicator */}
        <div className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-bold flex-shrink-0 relative overflow-hidden ${
          rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' :
          rank === 2 ? 'bg-slate-100 text-slate-700' :
          rank === 3 ? 'bg-orange-100 text-orange-700' :
          'text-slate-400 bg-slate-50'
        }`}>
          {rank === 1 ? (
            <>
               <span className="absolute inset-0 flex items-center justify-center rank-number-anim">1</span>
               <div className="absolute inset-0 flex items-center justify-center rank-crown-anim">
                  <Crown size={16} className="fill-yellow-400 text-yellow-700" strokeWidth={2.5} />
               </div>
            </>
          ) : (
            rank
          )}
        </div>

        {/* Avatar */}
        <Avatar 
          handle={person.handle} 
          name={person.name} 
          size={isTop3 ? 'md' : 'sm'} 
          className={isTop3 ? 'ring-2 ring-offset-2 ring-slate-100' : ''} 
        />

        {/* Main Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate text-base leading-tight">
              {person.name}
            </h3>
            {person.lastTrend === 'up' && (
              <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <a 
              href={`https://x.com/${person.handle}`}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 group/link hover:text-blue-500 hover:underline transition-colors z-20"
            >
              <XIcon className="w-3 h-3" />
              <span className="truncate max-w-[100px]">
                @{person.handle}
              </span>
            </a>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="truncate bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide text-slate-600">
              {person.category}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0 pl-2 border-l border-slate-100">
          <div className="font-mono font-bold text-slate-900 text-sm">
            {(person.voteCount / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-400 font-medium">votes</div>
        </div>

        {/* Dropdown Indicator */}
        <div className={`absolute -right-1 -top-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
           <div className="bg-slate-100 text-slate-400 rounded-full p-0.5 hidden group-hover:block">
              <ChevronDown size={12} />
           </div>
        </div>
      </div>

      {/* Expanded Action Area */}
      {isExpanded && (
        <div className="relative z-10 bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-2 flex justify-between items-center animate-in slide-in-from-top-2">
          
          {/* Vote Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onVote(person);
            }}
            className="flex-1 mr-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-all hover:-translate-y-0.5"
          >
            <ThumbsUp size={12} />
            Vote +1
          </button>

          {/* Share Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onShare(person);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 transition-all"
          >
            <Share2 size={12} />
            Share
          </button>
        </div>
      )}
    </div>
  );
};

export default InspirationCard;