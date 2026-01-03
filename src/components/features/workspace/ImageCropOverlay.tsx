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

    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [targetImageUrl, setTargetImageUrl] = useState<string>('');
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [screenPos, setScreenPos] = useState({ top: 0, left: 0 });
    const [elementSize, setElementSize] = useState({ width: 0, height: 0 }); // Logical full image size
    const [copiedStyle, setCopiedStyle] = useState<React.CSSProperties>({});
    const [initialOffsets, setInitialOffsets] = useState({ offX: 0, offY: 0 });

    const isDragging = useRef(false);
    const dragType = useRef<'move' | 'resize' | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, startRect: { x: 0, y: 0, width: 0, height: 0 } });

    const loadImageInfo = useCallback(async (el: HTMLElement) => {
        let url = '';
        if (el instanceof HTMLImageElement) {
            url = el.src;
        } else {
            const bg = window.getComputedStyle(el).backgroundImage;
            const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) url = match[1];
        }
        if (!url) return null;
        return new Promise<{ url: string; width: number; height: number }>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ url, width: 0, height: 0 });
            img.src = url;
        });
    }, []);

    useEffect(() => {
        if (isImageCropMode && croppingElementId) {
            const el = document.getElementById(croppingElementId);
            if (el) {
                setTarget(el);
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                loadImageInfo(el).then((info) => {
                    if (info) {
                        const NW = info.width;
                        const NH = info.height;

                        // 1. コンテンツ領域（画像が表示される枠）の正確なサイズ取得
                        const borderT = parseFloat(style.borderTopWidth) || 0;
                        const borderL = parseFloat(style.borderLeftWidth) || 0;
                        const borderR = parseFloat(style.borderRightWidth) || 0;
                        const borderB = parseFloat(style.borderBottomWidth) || 0;
                        const paddingT = parseFloat(style.paddingTop) || 0;
                        const paddingL = parseFloat(style.paddingLeft) || 0;
                        const paddingR = parseFloat(style.paddingRight) || 0;
                        const paddingB = parseFloat(style.paddingBottom) || 0;

                        // getBoundingClientRect() は border を含むので、内側のサイズを zoom 考慮して算出
                        const contentW = (rect.width / zoom) - borderL - borderR - paddingL - paddingR;
                        const contentH = (rect.height / zoom) - borderT - borderB - paddingT - paddingB;

                        const parsePct = (p: string) => {
                            if (!p || p === 'center') return 50;
                            if (p === 'left' || p === 'top') return 0;
                            if (p === 'right' || p === 'bottom') return 100;
                            return parseFloat(p.replace('%', ''));
                        };

                        let s = 1;
                        let curPX = 50;
                        let curPY = 50;

                        if (style.backgroundSize && style.backgroundSize.includes('%')) {
                            // 背景画像モード
                            const pctW = parsePct(style.backgroundSize.split(' ')[0]);
                            s = (pctW / 100) * contentW / NW;
                            curPX = parsePct(style.backgroundPosition.split(' ')[0]);
                            curPY = parsePct(style.backgroundPosition.split(' ')[1] || style.backgroundPosition.split(' ')[0]);
                        } else {
                            // img + object-fit モード
                            s = Math.max(contentW / NW, contentH / NH);
                            const objPos = (style.objectPosition || '50% 50%').split(' ');
                            curPX = parsePct(objPos[0]);
                            curPY = parsePct(objPos[1] || objPos[0]);
                        }

                        // フル画像の論理サイズ
                        const fullW = NW * s;
                        const fullH = NH * s;

                        // コンテンツ領域に対するフル画像のオフセットを算出
                        // (contentW - fullW) * (pct / 100)
                        const offX = (contentW - fullW) * (curPX / 100);
                        const offY = (contentH - fullH) * (curPY / 100);

                        setNaturalSize({ width: NW, height: NH });
                        setElementSize({ width: fullW, height: fullH });
                        setInitialOffsets({ offX, offY });

                        // 【重要】スクリーン上の絶対位置合わせ
                        // rect.left は要素（Border Box）の左端。
                        // これに「コンテンツ領域までの距離」と「そこからの画像オフセット」を足すと
                        // まさに今表示されている画像の「フルサイズの左上」のスクリーン座標になる。
                        setScreenPos({
                            left: rect.left + (borderL + paddingL + offX) * zoom,
                            top: rect.top + (borderT + paddingT + offY) * zoom
                        });

                        // 2. クロップ領域の初期化
                        // 「リセット」要件に従い、最初はフル画像全体を覆うように設定。
                        // ただし、現在の表示領域（Content Box）に相当する部分に枠があってもいいが、
                        // ユーザーの要望は「元画像全体から選び直す」（リセット）なので、フル全体を初期値にする。
                        let initialRect = { x: 0, y: 0, width: fullW, height: fullH };
                        if (imageCropAspectRatio) {
                            const currentRatio = fullW / fullH;
                            if (currentRatio > imageCropAspectRatio) {
                                const nw = fullH * imageCropAspectRatio;
                                initialRect.width = nw;
                                initialRect.x = (fullW - nw) / 2;
                            } else {
                                const nh = fullW / imageCropAspectRatio;
                                initialRect.height = nh;
                                initialRect.y = (fullH - nh) / 2;
                            }
                        }
                        setCropRect(initialRect);
                    }
                });

                setCopiedStyle({
                    borderRadius: style.borderRadius,
                    boxSizing: 'border-box'
                    // Border/Paddingは背景合わせのためにはコピーしない（screenPosで調整済み）
                });
            }
        } else {
            setTarget(null);
            setTargetImageUrl('');
        }
    }, [isImageCropMode, croppingElementId, imageCropAspectRatio, loadImageInfo, zoom]);

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation(); e.preventDefault();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startRect: { ...cropRect } };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragType.current || !target) return;
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
                if (imageCropAspectRatio) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) newHeight = newWidth / imageCropAspectRatio;
                    else newWidth = newHeight * imageCropAspectRatio;
                }
                newWidth = Math.max(20, newWidth);
                newHeight = Math.max(20, newHeight);
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

    useEffect(() => {
        if (isImageCropMode) {
            const handleMouseUp = () => { isDragging.current = false; dragType.current = null; };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
        }
    }, [isImageCropMode, handleMouseMove]);

    const handleApply = () => {
        if (!target || naturalSize.width === 0) return;
        const { x, y, width: cropW, height: cropH } = cropRect;
        const { width: NW, height: NH } = naturalSize;
        const { width: EW } = elementSize;
        const s = EW / NW;

        const newSourceX = x / s;
        const newSourceY = y / s;
        const newSourceW = cropW / s;
        const newSourceH = cropH / s;

        const finalScale = cropW / newSourceW;
        const bgSizeW = (NW * finalScale / cropW) * 100;
        const bgSizeH = (NH * finalScale / cropH) * 100;
        const denX = NW - newSourceW;
        const denY = NH - newSourceH;
        const finalPX = Math.abs(denX) < 0.1 ? 50 : (newSourceX / denX) * 100;
        const finalPY = Math.abs(denY) < 0.1 ? 50 : (newSourceY / denY) * 100;

        let finalTarget = target;
        if (target.tagName.toLowerCase() === 'img') {
            const div = document.createElement('div');
            Array.from(target.attributes).forEach(attr => { if (attr.name !== 'src') div.setAttribute(attr.name, attr.value); });
            target.parentNode?.replaceChild(div, target);
            finalTarget = div;
        }

        finalTarget.style.opacity = '0';

        // 移動量の計算
        // オーバーレイの (x, y) はフル画像の左上からの距離。
        // モード開始時の表示枠の左上は、フル画像の (-initialOffsets.offX, -initialOffsets.offY) 地点。※offXは負の値になる傾向
        // したがって、表示枠を基準にした移動量は x + offX となる。
        const moveX = x + initialOffsets.offX;
        const moveY = y + initialOffsets.offY;

        const currentStyle = finalTarget.getAttribute('style') || '';
        let transStr = currentStyle.match(/transform:\s*([^;]+)/)?.[1] || finalTarget.style.transform || '';
        const tRegex = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/;
        const ttMatch = transStr.match(tRegex);
        if (ttMatch) {
            const bx = parseFloat(ttMatch[1]); const by = parseFloat(ttMatch[2]);
            transStr = transStr.replace(tRegex, `translate(${bx + moveX}px, ${by + moveY}px)`);
        } else {
            transStr = `${transStr} translate(${moveX}px, ${moveY}px)`.trim();
        }

        finalTarget.style.transform = transStr;
        finalTarget.style.width = `${cropW}px`;
        finalTarget.style.height = `${cropH}px`;
        finalTarget.style.backgroundImage = `url('${targetImageUrl}')`;
        finalTarget.style.backgroundSize = `${bgSizeW.toFixed(8)}% ${bgSizeH.toFixed(8)}%`;
        finalTarget.style.backgroundPosition = `${finalPX.toFixed(8)}% ${finalPY.toFixed(8)}%`;
        finalTarget.style.backgroundRepeat = 'no-repeat';
        finalTarget.style.objectFit = ''; finalTarget.style.objectPosition = '';
        finalTarget.setAttribute('style', finalTarget.style.cssText);

        setImageCropMode(false, null);
        requestAnimationFrame(() => {
            finalTarget.style.opacity = '1';
            window.dispatchEvent(new CustomEvent('canvas-update'));
        });
    };

    if (!isImageCropMode || !target) return null;
    const screenWidth = elementSize.width * zoom;
    const screenHeight = elementSize.height * zoom;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={() => setImageCropMode(false, null)} />
            {/* 
                フル画像（リセット後の全体像）を配置。
                背景としての透明度を上げ、現在の表示位置と完全に一致させている。
            */}
            <div className="absolute pointer-events-none opacity-40 blur-[1px]" style={{ top: `${screenPos.top}px`, left: `${screenPos.left}px`, width: `${screenWidth}px`, height: `${screenHeight}px` }}>
                <img src={targetImageUrl} className="w-full h-full object-contain" alt="" style={{ ...copiedStyle }} />
            </div>

            <div className="absolute pointer-events-none" style={{ top: `${screenPos.top}px`, left: `${screenPos.left}px`, width: `${screenWidth}px`, height: `${screenHeight}px` }}>
                <div className="absolute border-2 border-blue-500 cursor-move pointer-events-auto shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ left: `${cropRect.x * zoom}px`, top: `${cropRect.y * zoom}px`, width: `${cropRect.width * zoom}px`, height: `${cropRect.height * zoom}px`, overflow: 'hidden', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }} onMouseDown={(e) => handleMouseDown(e, 'move')}>
                    <img src={targetImageUrl} className="absolute pointer-events-none" style={{ left: `${-cropRect.x * zoom}px`, top: `${-cropRect.y * zoom}px`, width: `${screenWidth}px`, height: `${screenHeight}px`, maxWidth: 'none', maxHeight: 'none', ...copiedStyle, objectFit: 'fill' }} alt="" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/50" />)}
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center cursor-nwse-resize z-50 hover:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'resize')}>
                        <Maximize2 size={16} className="text-white rotate-90" />
                    </div>
                </div>
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar/95 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 pointer-events-auto">
                    <div className="px-4 py-1 border-r border-white/10 mr-1 hidden sm:block">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Cropping</span>
                        <span className="text-xs text-white font-medium">画像全体から範囲を選択</span>
                    </div>
                    <button onClick={handleApply} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-95"><Check size={18} /><span>適用</span></button>
                    <button onClick={() => setImageCropMode(false, null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={24} /></button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropOverlay;
