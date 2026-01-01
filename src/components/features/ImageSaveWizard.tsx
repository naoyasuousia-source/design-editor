import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Crop, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { toPng } from 'html-to-image';
import { cn } from '@/utils/cn';

const ImageSaveWizard: React.FC = () => {
    const {
        setImageSaveMode,
        cropAspectRatio,
        setCropAspectRatio,
        zoom
    } = useEditorStore();

    const [isCropping, setIsCropping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // トリミング領域の状態（ピクセル単位）
    const [cropRect, setCropRect] = useState({ top: 0, left: 0, width: 300, height: 300 });
    const cropRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, rect: { top: 0, left: 0 } });

    const handleCancel = () => {
        setImageSaveMode(false);
        setCropAspectRatio(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const surface = document.querySelector('.DesignSurface') as HTMLElement;
        if (!surface) return;

        try {
            let dataUrl = '';
            if (isCropping) {
                // トリミングありの場合
                dataUrl = await toPng(surface, {
                    canvasWidth: cropRect.width,
                    canvasHeight: cropRect.height,
                    width: cropRect.width,
                    height: cropRect.height,
                    style: {
                        transform: `scale(1) translate(${-cropRect.left}px, ${-cropRect.top}px)`,
                        transformOrigin: 'top left',
                        width: surface.offsetWidth + 'px',
                        height: surface.offsetHeight + 'px',
                    },
                    // html-to-image の制限により、クリッピングが難しい場合は filter を使うこともあるが、
                    // ここではシンプルなスタイル調整で試行
                });
            } else {
                // キャンバス全体の保存
                dataUrl = await toPng(surface);
            }

            const link = document.createElement('a');
            link.download = `design-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            handleCancel();
        } catch (err) {
            console.error('Failed to save image:', err);
            alert('画像の保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (!isCropping) return;
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            rect: { top: cropRect.top, left: cropRect.left }
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const dx = (e.clientX - dragStart.current.x) / zoom;
            const dy = (e.clientY - dragStart.current.y) / zoom;

            setCropRect(prev => ({
                ...prev,
                left: dragStart.current.rect.left + dx,
                top: dragStart.current.rect.top + dy
            }));
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [zoom]);

    return (
        <div className="fixed inset-0 z-[150] pointer-events-none flex flex-col items-center">
            {/* ウィザードツールバー */}
            <div className="mt-20 pointer-events-auto bg-sidebar border border-white/10 rounded-full shadow-2xl p-1.5 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-1 px-4 border-r border-white/10 py-1">
                    <Camera size={16} className="text-blue-400" />
                    <span className="text-sm font-bold text-white ml-2">画像として保存</span>
                </div>

                <div className="flex items-center gap-1 p-1">
                    <button
                        onClick={() => setIsCropping(!isCropping)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            isCropping ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <Crop size={14} />
                        <span>トリミング</span>
                    </button>

                    {isCropping && (
                        <div className="flex items-center gap-1 ml-1 bg-black/20 rounded-full p-0.5">
                            {[
                                { label: 'Free', value: 'free' },
                                { label: '1:1', value: 1 },
                                { label: '9:16', value: 9 / 16 },
                            ].map(ratio => (
                                <button
                                    key={ratio.label}
                                    onClick={() => setCropAspectRatio(ratio.value as any)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold transition-all",
                                        cropAspectRatio === ratio.value ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    {ratio.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-2 py-1 pr-1">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Check size={14} />
                        )}
                        <span>{isSaving ? '保存中...' : '保存'}</span>
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* トリミング領域のオーバーレイ */}
            {isCropping && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                    <div
                        ref={cropRef}
                        className="border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move relative pointer-events-auto"
                        style={{
                            width: `${cropRect.width * zoom}px`,
                            height: `${cropRect.height * zoom}px`,
                        }}
                        onMouseDown={handleCropMouseDown}
                    >
                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-tighter -translate-y-full">
                            Crop Area
                        </div>
                        {/* リサイズハンドル（簡易実装） */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize rounded-tl-sm shadow-lg flex items-center justify-center">
                            <Maximize2 size={8} className="text-white" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageSaveWizard;
