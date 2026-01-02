import React from 'react';
import { X } from 'lucide-react';

interface ComparisonViewProps {
    onClose: () => void;
    oldImage?: string; // Base64
    newHtml?: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ onClose, oldImage, newHtml }) => {
    return (
        <div className="absolute inset-0 z-[200] bg-background flex flex-col animate-in fade-in duration-300">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-sidebar/50">
                <h2 className="text-lg font-bold">デザイン比較</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* 比較エリア */}
            <div className="flex-1 flex divide-x divide-white/10 overflow-hidden">
                {/* 左：Before (Snapshot) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="px-4 py-2 bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        変更前 (Before)
                    </div>
                    <div className="flex-1 bg-gray-900/10 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
                        {oldImage ? (
                            <img src={oldImage} alt="Old Version" className="shadow-2xl max-w-none" />
                        ) : (
                            <div className="text-gray-600 italic">スナップショットなし</div>
                        )}
                    </div>
                </div>

                {/* 右：After (Current) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="px-4 py-2 bg-black/20 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        変更後 (After)
                    </div>
                    <div className="flex-1 bg-white/5 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
                        {newHtml ? (
                            <div
                                className="bg-white shadow-2xl relative w-[600px] h-[600px]"
                                dangerouslySetInnerHTML={{ __html: newHtml }}
                            />
                        ) : (
                            <div className="w-[600px] h-[600px] bg-white shadow-2xl flex items-center justify-center text-gray-400">
                                最新の変更がここに表示されます
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;
