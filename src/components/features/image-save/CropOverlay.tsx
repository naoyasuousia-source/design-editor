import React from 'react';
import { Maximize2 } from 'lucide-react';

interface CropOverlayProps {
    cropRect: { x: number; y: number; width: number; height: number };
    surfaceBounds: { top: number; left: number; width: number; height: number };
    zoom: number;
    onMouseDown: (e: React.MouseEvent, type: 'move' | 'resize') => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ cropRect, surfaceBounds, zoom, onMouseDown }) => {
    return (
        <>
            <div
                className="fixed inset-0 pointer-events-auto bg-black/60 backdrop-blur-[1px] z-[-1]"
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${surfaceBounds.left + cropRect.x * zoom}px 100%, 
                        ${surfaceBounds.left + cropRect.x * zoom}px ${surfaceBounds.top + cropRect.y * zoom}px, 
                        ${surfaceBounds.left + (cropRect.x + cropRect.width) * zoom}px ${surfaceBounds.top + cropRect.y * zoom}px, 
                        ${surfaceBounds.left + (cropRect.x + cropRect.width) * zoom}px ${surfaceBounds.top + (cropRect.y + cropRect.height) * zoom}px, 
                        ${surfaceBounds.left + cropRect.x * zoom}px ${surfaceBounds.top + (cropRect.y + cropRect.height) * zoom}px, 
                        ${surfaceBounds.left + cropRect.x * zoom}px 100%, 
                        100% 100%, 100% 0%
                    )`
                }}
            />

            <div
                className="fixed border-2 border-blue-500 shadow-2xl cursor-move pointer-events-auto flex flex-col items-center justify-center animate-in fade-in duration-300"
                style={{
                    top: `${surfaceBounds.top + cropRect.y * zoom}px`,
                    left: `${surfaceBounds.left + cropRect.x * zoom}px`,
                    width: `${cropRect.width * zoom}px`,
                    height: `${cropRect.height * zoom}px`,
                }}
                onMouseDown={(e) => onMouseDown(e, 'move')}
            >
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest -translate-y-full rounded-t-sm">
                    CROP AREA {Math.round(cropRect.width)}x{Math.round(cropRect.height)}
                </div>

                {/* 装飾用の目盛り */}
                <div className="w-full h-full border border-white/20 pointer-events-none relative">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/30" />)}
                    </div>
                </div>

                {/* リサイズハンドル */}
                <div
                    className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 hover:bg-blue-400 cursor-nwse-resize rounded-full shadow-lg flex items-center justify-center border-2 border-white pointer-events-auto"
                    onMouseDown={(e) => onMouseDown(e, 'resize')}
                >
                    <Maximize2 size={12} className="text-white rotate-90" />
                </div>
            </div>
        </>
    );
};
