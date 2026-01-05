import React from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Maximize2 } from 'lucide-react';
import { useImageCrop } from '@/hooks/useImageCrop';
import { cn } from '@/utils/cn';

const ImageCropOverlay: React.FC = () => {
    const {
        isImageCropMode,
        target,
        targetImageUrl,
        cropRect,
        screenPos,
        elementSize,
        copiedStyle,
        imageCropAspectRatio,
        croppingElementId,
        zoom,
        handleApply,
        handleMouseDown,
        setImageCropMode
    } = useImageCrop();

    if (!isImageCropMode || !target) return null;

    const fullW = elementSize.width * zoom;
    const fullH = elementSize.height * zoom;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={() => setImageCropMode(false, null)} />

            {/* 背景ガイド */}
            <div className="absolute pointer-events-none opacity-30 blur-[0.5px]" style={{ left: screenPos.left, top: screenPos.top, width: fullW, height: fullH }}>
                {targetImageUrl && (
                    <img src={targetImageUrl} className="w-full h-full object-fill" style={copiedStyle} alt="" />
                )}
            </div>

            <div className="absolute pointer-events-none" style={{ left: screenPos.left, top: screenPos.top, width: fullW, height: fullH }}>
                {/* 選択枠 */}
                <div
                    className="absolute cursor-move pointer-events-auto outline outline-2 outline-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    style={{ left: cropRect.x * zoom, top: cropRect.y * zoom, width: cropRect.width * zoom, height: cropRect.height * zoom, overflow: 'hidden', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    {targetImageUrl && (
                        <img src={targetImageUrl} className="absolute pointer-events-none" style={{ left: -cropRect.x * zoom, top: -cropRect.y * zoom, width: fullW, height: fullH, maxWidth: 'none', maxHeight: 'none', ...copiedStyle, objectFit: 'fill' }} alt="" />
                    )}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white" />)}
                    </div>
                </div>

                {/* リサイズハンドル */}
                <div
                    className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg cursor-nwse-resize pointer-events-auto flex items-center justify-center hover:scale-125 transition-transform z-10"
                    style={{ left: (cropRect.x + cropRect.width) * zoom - 12, top: (cropRect.y + cropRect.height) * zoom - 12 }}
                    onMouseDown={(e) => handleMouseDown(e, 'resize')}
                >
                    <Maximize2 size={12} className="text-white rotate-90" />
                </div>

                {/* ボタンユニット */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar/95 backdrop-blur-md border border-white/10 p-4 rounded-full shadow-2xl pointer-events-auto ring-1 ring-white/10">
                    <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 mr-2 border border-white/5">
                        <button
                            onClick={() => setImageCropMode(true, croppingElementId, null)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all",
                                !imageCropAspectRatio ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Free
                        </button>
                        <button
                            onClick={() => setImageCropMode(true, croppingElementId, 1)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all",
                                imageCropAspectRatio === 1 ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            1:1
                        </button>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    <button onClick={handleApply} className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-full transition-all shadow-lg active:scale-95">
                        <Check size={20} />
                        <span>適用</span>
                    </button>
                    <button onClick={() => setImageCropMode(false, null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropOverlay;
