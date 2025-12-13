import React from 'react';
import { Person } from '../types';
import { Zap } from 'lucide-react';
import Avatar from './Avatar';

const RecentTicker: React.FC<{ recent: Person | null }> = ({ recent }) => {
  if (!recent) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 pr-4 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in duration-300 border border-slate-700/50">
        <div className="relative">
             <Avatar handle={recent.handle} name={recent.name} size="sm" className="ring-2 ring-slate-800" />
             <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-slate-900">
                <Zap className="w-2 h-2 text-white fill-white" />
             </div>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
                <span className="font-bold text-white">{recent.name}</span>
            </p>
            <p className="text-xs text-slate-400">just received a vote</p>
        </div>
      </div>
    </div>
  );
};

export default RecentTicker;