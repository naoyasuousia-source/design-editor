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
    const [cropViewport, setCropViewport] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [bounds, setBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const isDragging = useRef(false);
    const dragType = useRef<'move' | 'resize' | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, startViewport: { x: 0, y: 0, width: 0, height: 0 } });

    // 対象要素の初期化
    useEffect(() => {
        if (isImageCropMode && croppingElementId) {
            const el = document.getElementById(croppingElementId) as HTMLImageElement;
            if (el) {
                setTarget(el);

                // 現在の object-position から初期ビューポートを逆算
                // デフォルトは 50% 50% (中央)

                // 初回は常に全体表示で開始し、位置だけ反映させるか、100% 100% でリセットする
                // ユーザー体験としては「現在の見え方は一旦忘れて、全体から選び直す」方が混乱が少ないため 100% で開始
                setCropViewport({ x: 0, y: 0, width: 100, height: 100 });

                const rect = el.getBoundingClientRect();
                setBounds({
                    top: rect.top,
                    left: rect.left,
                    width: el.offsetWidth,
                    height: el.offsetHeight
                });
            }
        } else {
            setTarget(null);
        }
    }, [isImageCropMode, croppingElementId]);

    // 位置追従
    const updateBounds = useCallback(() => {
        if (target) {
            const rect = target.getBoundingClientRect();
            // スクロール等でズレないように絶対座標を更新
            setBounds({
                top: rect.top,
                left: rect.left,
                width: target.offsetWidth,
                height: target.offsetHeight
            });
        }
    }, [target]);

    useEffect(() => {
        if (!isImageCropMode) return;
        window.addEventListener('scroll', updateBounds, true);
        window.addEventListener('resize', updateBounds);
        const raf = requestAnimationFrame(function animate() {
            updateBounds();
            requestAnimationFrame(animate);
        });
        return () => {
            window.removeEventListener('scroll', updateBounds, true);
            window.removeEventListener('resize', updateBounds);
            cancelAnimationFrame(raf);
        };
    }, [isImageCropMode, updateBounds]);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation();
        e.preventDefault();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startViewport: { ...cropViewport }
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragType.current || !target) return;

        // 計算に zoom を考慮
        const deltaX = ((e.clientX - dragStart.current.mouseX) / (bounds.width * zoom)) * 100;
        const deltaY = ((e.clientY - dragStart.current.mouseY) / (bounds.height * zoom)) * 100;
        const { startViewport } = dragStart.current;

        setCropViewport(prev => {
            let next = { ...prev };
            if (dragType.current === 'move') {
                next.x = Math.max(0, Math.min(100 - prev.width, startViewport.x + deltaX));
                next.y = Math.max(0, Math.min(100 - prev.height, startViewport.y + deltaY));
            } else if (dragType.current === 'resize') {
                next.width = Math.max(10, Math.min(100 - startViewport.x, startViewport.width + deltaX));
                next.height = Math.max(10, Math.min(100 - startViewport.y, startViewport.height + deltaY));
            }
            return next;
        });
    }, [target, bounds.width, bounds.height, zoom]);

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

        // トリミング枠の中心を object-position に設定
        const centerX = cropViewport.x + cropViewport.width / 2;
        const centerY = cropViewport.y + cropViewport.height / 2;

        target.style.objectFit = 'cover';
        target.style.objectPosition = `${centerX}% ${centerY}%`;

        // 同期イベント発行
        window.dispatchEvent(new CustomEvent('canvas-update'));
        setImageCropMode(false, null);
    };

    const handleCancel = () => {
        setImageCropMode(false, null);
    };

    if (!isImageCropMode || !target) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* 背景シールド */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={handleCancel} />

            {/* 操作コンテナ */}
            <div
                className="absolute shadow-2xl pointer-events-auto"
                style={{
                    top: `${bounds.top}px`,
                    left: `${bounds.left}px`,
                    width: `${bounds.width}px`,
                    height: `${bounds.height}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                }}
            >
                {/* ガイド用の元画像（全体が見える状態） */}
                <div className="absolute inset-0 grayscale opacity-40">
                    <img
                        src={target.src}
                        alt="full"
                        className="w-full h-full object-contain bg-black/20"
                    />
                </div>

                {/* トリミング領域のマスク */}
                <div
                    className="absolute border-2 border-blue-500 cursor-move"
                    style={{
                        left: `${cropViewport.x}%`,
                        top: `${cropViewport.y}%`,
                        width: `${cropViewport.width}%`,
                        height: `${cropViewport.height}%`,
                        boxShadow: '0 0 0 4000px rgba(0,0,0,0.3)' // 周囲を少し暗く
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    {/* 切り抜かれる部分の鮮明なプレビュー */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={target.src}
                            style={{
                                width: `${100 / (cropViewport.width / 100)}%`,
                                height: `${100 / (cropViewport.height / 100)}%`,
                                left: `-${cropViewport.x / (cropViewport.width / 100)}%`,
                                top: `-${cropViewport.y / (cropViewport.height / 100)}%`,
                                position: 'absolute'
                            }}
                        />
                    </div>

                    {/* 三分割法ガイド */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/20" />)}
                    </div>

                    {/* 右下リサイズハンドル */}
                    <div
                        className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center cursor-nwse-resize z-50 hover:scale-110 transition-transform"
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                        <Maximize2 size={16} className="text-white rotate-90" />
                    </div>
                </div>

                {/* 操作UI */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar border border-white/10 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-4">
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
