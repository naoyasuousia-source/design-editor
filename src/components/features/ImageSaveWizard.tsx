import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Check, Crop, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { toPng } from 'html-to-image';
import { cn } from '@/utils/cn';

const ImageSaveWizard: React.FC = () => {
    const {
        setImageSaveMode,
        isImageSaveMode,
        cropAspectRatio,
        setCropAspectRatio,
        zoom
    } = useEditorStore();

    const [isCropping, setIsCropping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // トリミング領域の状態（デザインの等倍ピクセル単位）
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 300, height: 300 });
    const [surfaceBounds, setSurfaceBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const isDragging = useRef(false);
    const dragType = useRef<'move' | 'resize' | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, startRect: { x: 0, y: 0, width: 0, height: 0 } });

    // サーフェスの位置とサイズを取得
    const updateSurfaceBounds = useCallback(() => {
        const surface = document.querySelector('.DesignSurface') as HTMLElement;
        if (surface) {
            const rect = surface.getBoundingClientRect();
            setSurfaceBounds({
                top: rect.top,
                left: rect.left,
                width: surface.offsetWidth,
                height: surface.offsetHeight
            });
            return { width: surface.offsetWidth, height: surface.offsetHeight };
        }
        return null;
    }, []);

    useEffect(() => {
        const bounds = updateSurfaceBounds();
        if (bounds) {
            // 初期状態は画面中央付近に配置
            setCropRect({
                x: Math.max(0, (bounds.width - 300) / 2),
                y: Math.max(0, (bounds.height - 300) / 2),
                width: Math.min(bounds.width, 300),
                height: Math.min(bounds.height, 300)
            });
        }
        window.addEventListener('resize', updateSurfaceBounds);
        return () => window.removeEventListener('resize', updateSurfaceBounds);
    }, [updateSurfaceBounds]);

    // アスペクト比が変更された時の調整
    useEffect(() => {
        if (isCropping && cropAspectRatio && cropAspectRatio !== 'free') {
            setCropRect(prev => {
                let newWidth = prev.width;
                let newHeight = newWidth / cropAspectRatio;

                // キャンバスをはみ出す場合は縮小
                if (newHeight > surfaceBounds.height) {
                    newHeight = surfaceBounds.height;
                    newWidth = newHeight * cropAspectRatio;
                }

                // 中央寄せ気味に再配置
                return {
                    ...prev,
                    width: newWidth,
                    height: newHeight,
                    x: Math.min(prev.x, surfaceBounds.width - newWidth),
                    y: Math.min(prev.y, surfaceBounds.height - newHeight)
                };
            });
        }
    }, [cropAspectRatio, isCropping, surfaceBounds]);

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
                // html-to-image の pixelRatio を 2 にして解像度を確保
                dataUrl = await toPng(surface, {
                    canvasWidth: cropRect.width,
                    canvasHeight: cropRect.height,
                    width: cropRect.width,
                    height: cropRect.height,
                    pixelRatio: 2,
                    style: {
                        transform: `scale(1) translate(${-cropRect.x}px, ${-cropRect.y}px)`,
                        transformOrigin: 'top left',
                        width: surface.offsetWidth + 'px',
                        height: surface.offsetHeight + 'px',
                    },
                });
            } else {
                dataUrl = await toPng(surface, { pixelRatio: 2 });
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

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startRect: { ...cropRect }
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragType.current) return;

        const deltaX = (e.clientX - dragStart.current.mouseX) / zoom;
        const deltaY = (e.clientY - dragStart.current.mouseY) / zoom;
        const { startRect } = dragStart.current;

        setCropRect(prev => {
            let next = { ...prev };

            if (dragType.current === 'move') {
                next.x = Math.max(0, Math.min(surfaceBounds.width - prev.width, startRect.x + deltaX));
                next.y = Math.max(0, Math.min(surfaceBounds.height - prev.height, startRect.y + deltaY));
            } else if (dragType.current === 'resize') {
                let newWidth = Math.max(20, Math.min(surfaceBounds.width - startRect.x, startRect.width + deltaX));
                let newHeight = Math.max(20, Math.min(surfaceBounds.height - startRect.y, startRect.height + deltaY));

                if (cropAspectRatio && cropAspectRatio !== 'free') {
                    // 比率固定のリサイズ
                    const ratio = cropAspectRatio;
                    if (newWidth / newHeight > ratio) {
                        newWidth = newHeight * ratio;
                    } else {
                        newHeight = newWidth / ratio;
                    }

                    // 再度はみ出しチェック
                    if (startRect.x + newWidth > surfaceBounds.width) {
                        newWidth = surfaceBounds.width - startRect.x;
                        newHeight = newWidth / ratio;
                    }
                    if (startRect.y + newHeight > surfaceBounds.height) {
                        newHeight = surfaceBounds.height - startRect.y;
                        newWidth = newHeight * ratio;
                    }
                }
                next.width = newWidth;
                next.height = newHeight;
            }

            return next;
        });
    }, [zoom, surfaceBounds, cropAspectRatio]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragType.current = null;
    }, []);

    useEffect(() => {
        if (isImageSaveMode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isImageSaveMode, handleMouseMove, handleMouseUp]);

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
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all text-white",
                            isCropping ? "bg-blue-500" : "hover:bg-white/5"
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
                                { label: 'A4', value: 794 / 1123 },
                            ].map(ratio => (
                                <button
                                    key={ratio.label}
                                    onClick={() => setCropAspectRatio(ratio.value as number | 'free' | null)}
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
            )}

            {isCropping && (
                <div
                    className="fixed border-2 border-blue-500 shadow-2xl cursor-move pointer-events-auto flex flex-col items-center justify-center"
                    style={{
                        top: `${surfaceBounds.top + cropRect.y * zoom}px`,
                        left: `${surfaceBounds.left + cropRect.x * zoom}px`,
                        width: `${cropRect.width * zoom}px`,
                        height: `${cropRect.height * zoom}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
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
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                        <Maximize2 size={12} className="text-white rotate-90" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageSaveWizard;
