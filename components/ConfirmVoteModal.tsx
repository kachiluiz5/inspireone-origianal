import React from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import Avatar from './Avatar';

interface ConfirmVoteModalProps {
    person: {
        name: string;
        handle: string;
        category: string;
    };
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmVoteModal: React.FC<ConfirmVoteModalProps> = ({ person, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-white" />
                        <h3 className="text-lg font-bold text-white">Confirm Your Vote</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-white">
                    <p className="text-slate-700 mb-6 text-sm font-medium">
                        You're about to vote for this person. Please confirm this is who you meant:
                    </p>

                    {/* Person Preview */}
                    <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-800">
                        <div className="flex items-center gap-4">
                            <Avatar
                                handle={person.handle}
                                name={person.name}
                                size="lg"
                                className="ring-2 ring-white/20"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-lg mb-1">{person.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <span>@{person.handle}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-medium uppercase border border-slate-700">
                                        {person.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Confirm Vote
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmVoteModal;
