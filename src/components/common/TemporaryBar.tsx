import React from 'react';
import { Check, X, SplitSquareVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TemporaryBarProps {
    onApprove: () => void;
    onDiscard: () => void;
    onCompare: () => void;
}

const TemporaryBar: React.FC<TemporaryBarProps> = ({ onApprove, onDiscard, onCompare }) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 p-2 bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                <div className="px-4 py-1 border-r border-white/10 mr-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Update Found</span>
                </div>

                <button
                    onClick={onCompare}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <SplitSquareVertical className="w-4 h-4 text-blue-400" />
                    比較表示
                </button>

                <button
                    onClick={onDiscard}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 rounded-full transition-all"
                >
                    <X className="w-4 h-4 text-red-400" />
                    破棄
                </button>

                <button
                    onClick={onApprove}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-full shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Check className="w-4 h-4" />
                    変更を承認
                </button>
            </div>
        </div>
    );
};

export default TemporaryBar;
