import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

const ImageCropOverlay: React.FC = () => {
    const {
        isImageCropMode,
        croppingElementId,
        setImageCropMode,
        zoom
    } = useEditorStore();

    const [target, setTarget] = useState<HTMLImageElement | null>(null);
    // cropRect は論理座標（zoom 適用前のピクセル単位）で管理
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    // screenPos はスクリーン座標（表示位置）
    const [screenPos, setScreenPos] = useState({ top: 0, left: 0 });
    // 元の要素サイズ（論理座標）
    const [elementSize, setElementSize] = useState({ width: 0, height: 0 });

    const isDragging = useRef(false);
    const dragType = useRef<'move' | 'resize' | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, startRect: { x: 0, y: 0, width: 0, height: 0 } });

    // 対象要素の初期化
    useEffect(() => {
        if (isImageCropMode && croppingElementId) {
            const el = document.getElementById(croppingElementId) as HTMLImageElement;
            if (el) {
                setTarget(el);
                const rect = el.getBoundingClientRect();

                // 論理サイズ（zoom 適用前）
                const logicalWidth = el.offsetWidth;
                const logicalHeight = el.offsetHeight;

                setElementSize({ width: logicalWidth, height: logicalHeight });

                // 初回は要素全体をトリミング枠にする
                setCropRect({
                    x: 0,
                    y: 0,
                    width: logicalWidth,
                    height: logicalHeight
                });

                // スクリーン上の表示位置
                setScreenPos({
                    top: rect.top,
                    left: rect.left
                });
            }
        } else {
            setTarget(null);
        }
    }, [isImageCropMode, croppingElementId]);

    // スクリーン位置の追従
    const updateScreenPos = useCallback(() => {
        if (target) {
            const rect = target.getBoundingClientRect();
            setScreenPos({
                top: rect.top,
                left: rect.left
            });
        }
    }, [target]);

    useEffect(() => {
        if (!isImageCropMode) return;
        let animationId: number;
        const animate = () => {
            updateScreenPos();
            animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isImageCropMode, updateScreenPos]);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation();
        e.preventDefault();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startRect: { ...cropRect }
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragType.current || !target) return;

        // マウス移動量を論理座標に変換
        const deltaX = (e.clientX - dragStart.current.mouseX) / zoom;
        const deltaY = (e.clientY - dragStart.current.mouseY) / zoom;
        const { startRect } = dragStart.current;

        setCropRect(prev => {
            let next = { ...prev };
            if (dragType.current === 'move') {
                next.x = Math.max(0, Math.min(elementSize.width - prev.width, startRect.x + deltaX));
                next.y = Math.max(0, Math.min(elementSize.height - prev.height, startRect.y + deltaY));
            } else if (dragType.current === 'resize') {
                next.width = Math.max(20, Math.min(elementSize.width - startRect.x, startRect.width + deltaX));
                next.height = Math.max(20, Math.min(elementSize.height - startRect.y, startRect.height + deltaY));
            }
            return next;
        });
    }, [target, zoom, elementSize]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragType.current = null;
    }, []);

    useEffect(() => {
        if (isImageCropMode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isImageCropMode, handleMouseMove, handleMouseUp]);

    const handleApply = () => {
        if (!target) return;

        // トリミング枠の中心を object-position に設定（パーセント）
        const centerX = ((cropRect.x + cropRect.width / 2) / elementSize.width) * 100;
        const centerY = ((cropRect.y + cropRect.height / 2) / elementSize.height) * 100;

        target.style.objectFit = 'cover';
        target.style.objectPosition = `${centerX}% ${centerY}%`;

        window.dispatchEvent(new CustomEvent('canvas-update'));
        setImageCropMode(false, null);
    };

    const handleCancel = () => {
        setImageCropMode(false, null);
    };

    if (!isImageCropMode || !target) return null;

    // スクリーン上の実際の表示サイズ
    const screenWidth = elementSize.width * zoom;
    const screenHeight = elementSize.height * zoom;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* 背景シールド */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={handleCancel} />

            {/* メインコンテナ（スクリーン座標で配置） */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: `${screenPos.top}px`,
                    left: `${screenPos.left}px`,
                    width: `${screenWidth}px`,
                    height: `${screenHeight}px`,
                }}
            >
                {/* 1. 背景ガイド画像（元画像と同じ見た目、薄く表示） */}
                <img
                    src={target.src}
                    className="absolute inset-0 w-full h-full grayscale opacity-30 pointer-events-none"
                    style={{
                        objectFit: (target.style.objectFit as React.CSSProperties['objectFit']) || 'cover',
                        objectPosition: target.style.objectPosition || 'center'
                    }}
                    alt=""
                />

                {/* 2. トリミング枠（論理座標 × zoom でスクリーン座標に変換） */}
                <div
                    className="absolute border-2 border-blue-500 cursor-move pointer-events-auto"
                    style={{
                        left: `${cropRect.x * zoom}px`,
                        top: `${cropRect.y * zoom}px`,
                        width: `${cropRect.width * zoom}px`,
                        height: `${cropRect.height * zoom}px`,
                        overflow: 'hidden',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    {/* 3. 枠内の画像（親コンテナ全体と同じサイズ、位置は枠の負の値） */}
                    <img
                        src={target.src}
                        className="absolute pointer-events-none"
                        style={{
                            // 枠の左上を基準に、元の位置に画像を配置
                            left: `${-cropRect.x * zoom}px`,
                            top: `${-cropRect.y * zoom}px`,
                            // 親コンテナ（操作領域全体）と同じサイズ
                            width: `${screenWidth}px`,
                            height: `${screenHeight}px`,
                            objectFit: (target.style.objectFit as React.CSSProperties['objectFit']) || 'cover',
                            objectPosition: target.style.objectPosition || 'center'
                        }}
                        alt=""
                    />

                    {/* 三分割法ガイド */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/50" />)}
                    </div>

                    {/* 右下リサイズハンドル */}
                    <div
                        className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center cursor-nwse-resize z-50 hover:scale-110 transition-transform"
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                        <Maximize2 size={16} className="text-white rotate-90" />
                    </div>
                </div>

                {/* 操作ボタン */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar border border-white/10 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 pointer-events-auto">
                    <button
                        onClick={handleApply}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Check size={18} />
                        <span>適用</span>
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-500 text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg whitespace-nowrap">
                    Real-time Crop Mode
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropOverlay;
