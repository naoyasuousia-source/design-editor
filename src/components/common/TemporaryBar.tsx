import React from 'react';
import { Check, X, SplitSquareVertical, Sparkles } from 'lucide-react';

interface TemporaryBarProps {
    onApprove: () => void;
    onDiscard: () => void;
    onCompare: () => void;
}

const TemporaryBar: React.FC<TemporaryBarProps> = ({ onApprove, onDiscard, onCompare }) => {
    return (
        <div className="fixed top-16 left-0 right-0 z-[100] flex justify-center px-4 animate-in slide-in-from-top-4 duration-300 pointer-events-none">
            <div className="flex items-center gap-2 p-3 bg-sidebar/95 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                {/* 状態表示 */}
                <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl mr-2">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">AI Update Detected</div>
                        <div className="text-xs font-medium text-white/90">新しいデザイン変更が届きました</div>
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCompare}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 border border-white/5 rounded-xl transition-all active:scale-95 group"
                    >
                        <SplitSquareVertical className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        比較して確認
                    </button>

                    <button
                        onClick={onDiscard}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl transition-all active:scale-95 group"
                    >
                        <X className="w-4 h-4 text-red-400 group-hover:rotate-90 transition-transform" />
                        変更を破棄
                    </button>

                    <button
                        onClick={onApprove}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 hover:shadow-primary/50"
                    >
                        <Check className="w-4 h-4" />
                        デザインを反映
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemporaryBar;
