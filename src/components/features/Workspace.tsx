import React, { useRef } from 'react';
import { cn } from '@/utils/cn';

interface WorkspaceProps {
    isLocked: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ isLocked }) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
            {/* 
        デザイン領域（キャンバス）
        初期状態は正方形。背景白。
      */}
            <div
                ref={canvasRef}
                className={cn(
                    "bg-white shadow-2xl relative transition-all duration-300",
                    "w-[600px] h-[600px] min-w-[300px] min-h-[300px]",
                    isLocked && "pointer-events-none brightness-75 grayscale-[0.2]"
                )}
            >
                {/* 初期コンテンツ：使い方説明 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-gray-800">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">AI-Link Design へようこそ</h2>
                    <p className="text-gray-500 leading-relaxed mb-8">
                        左上の「新規作成」からキャンバスを作成するか、<br />
                        「開く」から既存のHTMLファイルを選択してください。
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm w-full max-w-sm">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                            AIがデザインを生成し、<br />リアルタイムで反映されます。
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                            GUIで自由にレイアウトを<br />微調整できます。
                        </div>
                    </div>
                </div>

                {/* ロック時のオーバーレイ（ローディングインジケーターなど） */}
                {isLocked && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-primary">デザインを同期中...</span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .CustomScrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .CustomScrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .CustomScrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .CustomScrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    );
};

export default Workspace;
