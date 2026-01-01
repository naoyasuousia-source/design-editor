import React, { useRef } from 'react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { PAGE_SIZES } from '@/types/editor';
import { useAutoSync } from '@/hooks/useAutoSync';

interface WorkspaceProps {
    isLocked: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ isLocked }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const { pageSize, zoom, content } = useEditorStore();
    const config = PAGE_SIZES[pageSize];

    // AI更新検知の開始
    useAutoSync();

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
            {/* 
        デザイン領域（キャンバス）
        選択されたページサイズとズーム倍率に基づいて動的にサイズを変更。
      */}
            <div
                ref={canvasRef}
                style={{
                    width: `${config.width * zoom}px`,
                    height: `${config.height * zoom}px`,
                }}
                className={cn(
                    "bg-white shadow-2xl relative transition-all duration-300 origin-center",
                    isLocked && "pointer-events-none brightness-75 grayscale-[0.2]"
                )}
            >
                {/* メインコンテンツ（AI生成HTML） */}
                <div
                    className="absolute inset-0 w-full h-full DesignSurface"
                    dangerouslySetInnerHTML={{ __html: content }}
                    contentEditable={!isLocked}
                    suppressContentEditableWarning={true}
                />

                {/* コンテンツがない場合の初期表示（使い方説明） */}
                {!content && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-gray-800 pointer-events-none select-none overflow-hidden">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">AI-Link Design</h2>
                        <p className="text-gray-500 leading-relaxed max-w-sm mb-4">
                            キャンバスサイズ: <span className="font-bold text-gray-700">{config.label}</span>
                        </p>
                        <div className="text-xs text-gray-400">
                            左上のメニューから新しいプロジェクトを開始するか、<br />既存のHTMLファイルを開いてください。
                        </div>
                    </div>
                )}

                {/* ロック時のオーバーレイ */}
                {isLocked && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-primary">デザインを同期中...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workspace;
