import React, { useMemo } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { PAGE_SIZES } from '@/types/editor';

interface ComparisonViewProps {
    onClose: () => void;
    oldImage?: string; // Base64
    newHtml?: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ onClose, oldImage, newHtml }) => {
    const { pageSize, customWidth, customHeight } = useEditorStore();
    const config = PAGE_SIZES[pageSize];

    const currentWidth = customWidth || config.width;
    const currentHeight = customHeight || config.height;

    // 画面内に収まるようにスケーリングを計算
    const scale = useMemo(() => {
        const availableWidth = (window.innerWidth / 2) - 100;
        const availableHeight = window.innerHeight - 200;
        const scaleW = availableWidth / currentWidth;
        const scaleH = availableHeight / currentHeight;
        return Math.min(scaleW, scaleH, 1);
    }, [currentWidth, currentHeight]);

    return (
        <div className="absolute inset-0 z-[200] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-sidebar/80">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">デザイン変更を比較</h2>
                        <p className="text-xs text-gray-400">左：変更前 (Snapshot) / 右：変更後 (Current Logic)</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="group p-2 hover:bg-white/10 rounded-full transition-all active:scale-95"
                    title="閉じる"
                >
                    <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                </button>
            </div>

            {/* 比較エリア */}
            <div className="flex-1 flex divide-x divide-white/10 overflow-hidden">
                {/* 左：Before (Snapshot) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-black/20">
                    <div className="px-6 py-2 bg-black/40 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 border-b border-white/5">
                        変更前 (Before)
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
                        {oldImage ? (
                            <div
                                style={{
                                    width: `${currentWidth * scale}px`,
                                    height: `${currentHeight * scale}px`,
                                }}
                                className="shadow-2xl shadow-black/50 overflow-hidden"
                            >
                                <img
                                    src={oldImage}
                                    alt="Old Version"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="text-gray-600 italic flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-700" />
                                <span>スナップショットなし</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右：After (Current) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/5">
                    <div className="px-6 py-2 bg-blue-500/10 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 border-b border-white/5">
                        変更後 (After)
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
                        <div
                            style={{
                                width: `${currentWidth}px`,
                                height: `${currentHeight}px`,
                                transform: `scale(${scale})`,
                                transformOrigin: 'center',
                                flexShrink: 0
                            }}
                            className="bg-white shadow-2xl shadow-black/30 relative overflow-hidden"
                        >
                            {newHtml ? (
                                <div
                                    className="DesignSurface absolute inset-0 w-full h-full"
                                    dangerouslySetInnerHTML={{ __html: newHtml }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic">
                                    最新の変更がここに表示されます
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* フッター（ヒント） */}
            <div className="px-8 py-3 bg-black/40 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-500 font-medium">
                    変更内容を確認してください。このビューを閉じると承認・破棄の選択に戻ります。
                </p>
            </div>
        </div>
    );
};

export default ComparisonView;
