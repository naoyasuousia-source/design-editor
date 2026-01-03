import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

const ImageCropOverlay: React.FC = () => {
    const {
        isImageCropMode,
        croppingElementId,
        setImageCropMode,
        imageCropAspectRatio,
        zoom
    } = useEditorStore();

    const [target, setTarget] = useState<HTMLImageElement | null>(null);
    // cropRect は論理座標（zoom 適用前のピクセル単位）で管理
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    // screenPos はスクリーン座標（表示位置）
    const [screenPos, setScreenPos] = useState({ top: 0, left: 0 });
    // 元の要素サイズ（論理座標）
    const [elementSize, setElementSize] = useState({ width: 0, height: 0 });
    // スタイルのコピー用
    const [copiedStyle, setCopiedStyle] = useState<React.CSSProperties>({});

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

                // 初期 cropRect の計算
                let initialRect = {
                    x: 0,
                    y: 0,
                    width: logicalWidth,
                    height: logicalHeight
                };

                // アスペクト比指定がある場合（例: 1:1）
                if (imageCropAspectRatio) {
                    // 現在の画像領域内で最大のアスペクト比矩形を作成
                    const currentRatio = logicalWidth / logicalHeight;
                    if (currentRatio > imageCropAspectRatio) {
                        // 横長なので幅を縮める
                        const newWidth = logicalHeight * imageCropAspectRatio;
                        initialRect.width = newWidth;
                        initialRect.x = (logicalWidth - newWidth) / 2;
                    } else {
                        // 縦長なので高さを縮める
                        const newHeight = logicalWidth / imageCropAspectRatio;
                        initialRect.height = newHeight;
                        initialRect.y = (logicalHeight - newHeight) / 2;
                    }
                }

                setCropRect(initialRect);

                // スクリーン上の表示位置
                setScreenPos({
                    top: rect.top,
                    left: rect.left
                });

                // スタイルの取得と保存
                const style = window.getComputedStyle(el);
                setCopiedStyle({
                    borderTop: style.borderTop,
                    borderRight: style.borderRight,
                    borderBottom: style.borderBottom,
                    borderLeft: style.borderLeft,
                    borderRadius: style.borderRadius,
                    paddingTop: style.paddingTop,
                    paddingRight: style.paddingRight,
                    paddingBottom: style.paddingBottom,
                    paddingLeft: style.paddingLeft,
                    boxSizing: style.boxSizing as React.CSSProperties['boxSizing'],
                });
            }
        } else {
            setTarget(null);
        }
    }, [isImageCropMode, croppingElementId, imageCropAspectRatio]);

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
                let newWidth = startRect.width + deltaX;
                let newHeight = startRect.height + deltaY;

                // アスペクト比固定の処理
                if (imageCropAspectRatio) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // 幅優先
                        newHeight = newWidth / imageCropAspectRatio;
                    } else {
                        // 高さ優先
                        newWidth = newHeight * imageCropAspectRatio;
                    }
                }

                // 最小サイズ制限
                newWidth = Math.max(20, newWidth);
                newHeight = Math.max(20, newHeight);

                // 最大サイズ制限（はみ出し防止）
                // 右下方向のリサイズなので、(x + width) <= elementWidth, (y + height) <= elementHeight
                if (startRect.x + newWidth > elementSize.width) {
                    newWidth = elementSize.width - startRect.x;
                    if (imageCropAspectRatio) newHeight = newWidth / imageCropAspectRatio;
                }
                if (startRect.y + newHeight > elementSize.height) {
                    newHeight = elementSize.height - startRect.y;
                    if (imageCropAspectRatio) newWidth = newHeight * imageCropAspectRatio;
                }

                next.width = newWidth;
                next.height = newHeight;
            }
            return next;
        });
    }, [target, zoom, elementSize, imageCropAspectRatio]);

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

        // トリミング枠の論理座標とサイズ (表示上の座標)
        const x = Math.round(cropRect.x);
        const y = Math.round(cropRect.y);
        const cropW = Math.round(cropRect.width);
        const cropH = Math.round(cropRect.height);

        // 元の要素（表示中）のサイズ
        const { width: EW, height: EH } = elementSize;
        // 画像の元々の解像度
        const NW = target.naturalWidth;
        const NH = target.naturalHeight;

        if (!NW || !NH) return; // 画像未読み込み対策

        // 現在の object-position を解析（未設定なら center = 50% 50%）
        const style = window.getComputedStyle(target);
        const posStr = style.objectPosition || '50% 50%';
        const posParts = posStr.split(' ');
        const parsePos = (p: string, isWidth: boolean) => {
            if (p.endsWith('%')) return parseFloat(p);
            if (p === 'left' || p === 'top') return 0;
            if (p === 'center') return 50;
            if (p === 'right' || p === 'bottom') return 100;
            const val = parseFloat(p);
            return isNaN(val) ? 50 : val;
        };
        const curPX = parsePos(posParts[0], true);
        const curPY = parsePos(posParts[1] || posParts[0], false);

        // --- 1. 現時点での「元画像上の可視領域」を逆算 ---
        // object-fit: cover のスケール s = max(EW/NW, EH/NH)
        const s = Math.max(EW / NW, EH / NH);
        const SW = NW * s; // スケーリング後の画像幅
        const SH = NH * s; // スケーリング後の画像高

        // オフセット（element左上から見た画像左上の位置）
        // offset = (EW - SW) * (curPX / 100)
        const curOffX = (EW - SW) * (curPX / 100);
        const curOffY = (EH - SH) * (curPY / 100);

        // elementの左上 (0,0) は、元画像上の座標:
        // sourceX = -curOffX / s
        // sourceY = -curOffY / s
        const sourceX = -curOffX / s;
        const sourceY = -curOffY / s;

        // --- 2. 新しく選択された範囲の「元画像上の絶対座標」 ---
        // ユーザーがクリックした座標 (x, y) は element 上の座標なので、s で割って元座標に足す
        const newSourceX = sourceX + (x / s);
        const newSourceY = sourceY + (y / s);
        const newSourceW = cropW / s;
        const newSourceH = cropH / s;

        // --- 3. 新しい表示サイズ (cropW, cropH) に合わせた object-position の算出 ---
        // 新しいスケール s' = max(cropW/NW, cropH/NH)
        // ※ newSourceをぴったり表示したいが、object-fit:coverなため s' を使う必要がある
        const ns = Math.max(cropW / NW, cropH / NH);
        const nSW = NW * ns;
        const nSH = NH * ns;

        // 求めたいオフセット: newOffsetX = -newSourceX * ns
        // ※ ただし object-fit: cover により画像全体が ns でスケールされている
        const nOffX = -newSourceX * ns;
        const nOffY = -newSourceY * ns;

        // nOffX = (cropW - nSW) * (newPX / 100) => newPX = (nOffX / (cropW - nSW)) * 100
        const denX = cropW - nSW;
        const denY = cropH - nSH;
        const newPX = Math.abs(denX) < 0.1 ? 50 : (nOffX / denX) * 100;
        const newPY = Math.abs(denY) < 0.1 ? 50 : (nOffY / denY) * 100;

        // 適用処理
        target.style.opacity = '0';
        target.style.width = `${cropW}px`;
        target.style.height = `${cropH}px`;

        // 位置の更新 (既存の transform を壊さず translate を更新)
        const currentStyle = target.getAttribute('style') || '';
        const transformMatch = currentStyle.match(/transform:\s*([^;]+)/);
        let transStr = transformMatch ? transformMatch[1] : (target.style.transform || '');
        const tRegex = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/;
        const tMatch = transStr.match(tRegex);

        if (tMatch) {
            const bx = parseFloat(tMatch[1]);
            const by = parseFloat(tMatch[2]);
            transStr = transStr.replace(tRegex, `translate(${Math.round(bx + x)}px, ${Math.round(by + y)}px)`);
        } else {
            transStr = `${transStr} translate(${x}px, ${y}px)`.trim();
        }
        target.style.transform = transStr;

        target.style.objectFit = 'cover';
        target.style.objectPosition = `${newPX.toFixed(8)}% ${newPY.toFixed(8)}%`;
        target.setAttribute('style', target.style.cssText);

        setImageCropMode(false, null);

        requestAnimationFrame(() => {
            target.style.opacity = '1';
            window.dispatchEvent(new CustomEvent('canvas-update'));
        });
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
            {/* 背景シールド（クリックでキャンセルできるように透明な板は残す） */}
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleCancel} />

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
                {/* 2. トリミング枠（論理座標 × zoom でスクリーン座標に変換） */}
                <div
                    className="absolute border-2 border-blue-500 cursor-move pointer-events-auto"
                    style={{
                        left: `${cropRect.x * zoom}px`,
                        top: `${cropRect.y * zoom}px`,
                        width: `${cropRect.width * zoom}px`,
                        height: `${cropRect.height * zoom}px`,
                        overflow: 'hidden',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' // 枠外を暗くする
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                    {/* 3. 枠内の画像 */}
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
                            // Tailwindのmax-width: 100%を無効化
                            maxWidth: 'none',
                            maxHeight: 'none',

                            ...copiedStyle, // ボーダーなどを適用
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
