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
    const [elementSize, setElementSize] = useState({ width: 0, height: 0 }); // Logical full size
    const [contentBox, setContentBox] = useState({ width: 0, height: 0, top: 0, left: 0 });
    const [copiedStyle, setCopiedStyle] = useState<React.CSSProperties>({});

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
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);

                loadImageInfo(el).then((info) => {
                    if (info) {
                        const NW = info.width;
                        const NH = info.height;
                        const currentW = el.offsetWidth;
                        const currentH = el.offsetHeight;

                        setTargetImageUrl(info.url);
                        setNaturalSize({ width: NW, height: NH });

                        // 現在の状態からスケールとオフセットを算出して「リセット」された全貌を把握する
                        let s = 1;
                        let offX = 0;
                        let offY = 0;
                        const bgSize = style.backgroundSize;
                        const parsePct = (p: string) => parseFloat(p.replace('%', ''));

                        if (bgSize && bgSize.includes('%')) {
                            // div + background-image 方式（前回の適用後）
                            const pctW = parsePct(bgSize.split(' ')[0]);
                            s = (pctW / 100) * currentW / NW;
                            const bgPos = style.backgroundPosition.split(' ');
                            const pctX = parsePct(bgPos[0]);
                            const pctY = parsePct(bgPos[1] || bgPos[0]);
                            offX = (pctX / 100) * (currentW - NW * s);
                            offY = (pctY / 100) * (currentH - NH * s);
                        } else {
                            // img + object-fit or 初期状態
                            s = Math.max(currentW / NW, currentH / NH);
                            const objPos = (style.objectPosition || '50% 50%').split(' ');
                            const pctX = parsePct(objPos[0]);
                            const pctY = parsePct(objPos[1] || objPos[0]);
                            offX = (pctX / 100) * (currentW - NW * s);
                            offY = (pctY / 100) * (currentH - NH * s);
                        }

                        const fullW = NW * s;
                        const fullH = NH * s;

                        setElementSize({ width: fullW, height: fullH });
                        setScreenPos({
                            top: rect.top + offY * zoom,
                            left: rect.left + offX * zoom
                        });

                        // 初期 cropRect は「リセット」仕様に従い画像全体を覆うように設定
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

                // コンテンツボックス（ボーダー等の無視に使用、リセット時は 0,0 基準になるが念のため保持）
                setContentBox({ width: 0, height: 0, top: 0, left: 0 });

                setCopiedStyle({
                    borderTop: style.borderTop,
                    borderRight: style.borderRight,
                    borderBottom: style.borderBottom,
                    borderLeft: style.borderLeft,
                    borderRadius: style.borderRadius,
                    boxSizing: style.boxSizing as React.CSSProperties['boxSizing'],
                });
            }
        } else {
            setTarget(null);
            setTargetImageUrl('');
        }
    }, [isImageCropMode, croppingElementId, imageCropAspectRatio, loadImageInfo, zoom]);

    const updateScreenPos = useCallback(() => {
        if (target && isDragging.current === false) { // ドラッグ中以外は念のため追従
            // ただしリセット後は target の位置ではなく計算後の位置に固定する必要があるため
            // ここでの単純な連動は控えるか、offX/offY を考慮する必要がある
            // 今回は初期配置で固定し、zoom 追従に任せる
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
        const { width: EW, height: EH } = elementSize; // これはすでに「リセットされたフルサイズ」

        // リセット状態（EW, EH）において (x, y) から (cropW, cropH) を切り出す
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
        const finalPX = Math.abs(denX) < 1 ? 50 : (newSourceX / denX) * 100;
        const finalPY = Math.abs(denY) < 1 ? 50 : (newSourceY / denY) * 100;

        let finalTarget = target;
        if (target.tagName.toLowerCase() === 'img') {
            const div = document.createElement('div');
            Array.from(target.attributes).forEach(attr => { if (attr.name !== 'src') div.setAttribute(attr.name, attr.value); });
            target.parentNode?.replaceChild(div, target);
            finalTarget = div;
        }

        finalTarget.style.opacity = '0';
        finalTarget.style.width = `${Math.round(cropW)}px`;
        finalTarget.style.height = `${Math.round(cropH)}px`;

        // 位置の更新: オーバーレイの screenPos.left は el.left + offX*zoom だった
        // なので、実際の位置（x, y）だけを足せばよい。リセットしたため、基準点は fullW の左上にある。
        const style = window.getComputedStyle(finalTarget);
        const transformMatch = style.transform.match(/matrix\(([^,]+),[^,]+,[^,]+,([^,]+),([^,]+),([^,]+)\)/);
        // matrix から translate を取り出すのは面倒なので、getAttribute から直接取るか、差分を計算
        // ここでは単純に元々の要素の位置(rect.left)からの差分を適用する
        const currentStyle = finalTarget.getAttribute('style') || '';
        const tMatch = currentStyle.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);

        // --- 修正: リセットを考慮した位置計算 ---
        // オーバーレイ上の (x, y) は、フル画像の左上からのオフセット。
        // 開いた時の要素の左上は、フル画像の (offX, offY) 地点にいた。
        // したがって、移動量は (x - offX, y - offY) となる。
        const parsePct = (p: string) => parseFloat(p.replace('%', ''));
        const bgSizeStyle = style.backgroundSize;
        let oldOffX = 0; let oldOffY = 0;
        if (bgSizeStyle && bgSizeStyle.includes('%')) {
            const pctW = parsePct(bgSizeStyle.split(' ')[0]);
            const sOld = (pctW / 100) * (parseFloat(style.width) || finalTarget.offsetWidth) / NW;
            const bgPos = style.backgroundPosition.split(' ');
            oldOffX = (parsePct(bgPos[0]) / 100) * (finalTarget.offsetWidth - NW * sOld);
            oldOffY = (parsePct(bgPos[1] || bgPos[0]) / 100) * (finalTarget.offsetHeight - NH * sOld);
        } else if (target instanceof HTMLImageElement) {
            const sOld = Math.max(finalTarget.offsetWidth / NW, finalTarget.offsetHeight / NH);
            const objPos = (style.objectPosition || '50% 50%').split(' ');
            oldOffX = (parsePct(objPos[0]) / 100) * (finalTarget.offsetWidth - NW * sOld);
            oldOffY = (parsePct(objPos[1] || objPos[0]) / 100) * (finalTarget.offsetHeight - NH * sOld);
        }

        const moveX = x + oldOffX;
        const moveY = y + oldOffY;

        let transStr = currentStyle.match(/transform:\s*([^;]+)/)?.[1] || finalTarget.style.transform || '';
        const tRegex = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/;
        const ttMatch = transStr.match(tRegex);
        if (ttMatch) {
            const bx = parseFloat(ttMatch[1]); const by = parseFloat(ttMatch[2]);
            transStr = transStr.replace(tRegex, `translate(${Math.round(bx + moveX)}px, ${Math.round(by + moveY)}px)`);
        } else {
            transStr = `${transStr} translate(${Math.round(moveX)}px, ${Math.round(moveY)}px)`.trim();
        }
        finalTarget.style.transform = transStr;

        finalTarget.style.backgroundImage = `url('${targetImageUrl}')`;
        finalTarget.style.backgroundSize = `${bgSizeW.toFixed(8)}% ${bgSizeH.toFixed(8)}%`;
        finalTarget.style.backgroundPosition = `${finalPX.toFixed(8)}% ${finalPY.toFixed(8)}%`;
        finalTarget.style.backgroundRepeat = 'no-repeat';
        finalTarget.style.objectFit = ''; finalTarget.style.objectPosition = '';
        finalTarget.setAttribute('style', finalTarget.style.cssText);
        setImageCropMode(false, null);
        requestAnimationFrame(() => { finalTarget.style.opacity = '1'; window.dispatchEvent(new CustomEvent('canvas-update')); });
    };

    if (!isImageCropMode || !target) return null;
    const screenWidth = elementSize.width * zoom;
    const screenHeight = elementSize.height * zoom;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={() => setImageCropMode(false, null)} />
            <div className="absolute pointer-events-none" style={{ top: `${screenPos.top}px`, left: `${screenPos.left}px`, width: `${screenWidth}px`, height: `${screenHeight}px` }}>
                <div className="absolute border-2 border-blue-500 cursor-move pointer-events-auto" style={{ left: `${cropRect.x * zoom}px`, top: `${cropRect.y * zoom}px`, width: `${cropRect.width * zoom}px`, height: `${cropRect.height * zoom}px`, overflow: 'hidden', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} onMouseDown={(e) => handleMouseDown(e, 'move')}>
                    <img src={targetImageUrl} className="absolute pointer-events-none" style={{ left: `${-cropRect.x * zoom}px`, top: `${-cropRect.y * zoom}px`, width: `${screenWidth}px`, height: `${screenHeight}px`, maxWidth: 'none', maxHeight: 'none', ...copiedStyle, objectFit: 'cover', objectPosition: '0 0' }} alt="" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white/50" />)}
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center cursor-nwse-resize z-50 hover:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'resize')}>
                        <Maximize2 size={16} className="text-white rotate-90" />
                    </div>
                </div>
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar border border-white/10 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 pointer-events-auto">
                    <button onClick={handleApply} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-500/20"><Check size={18} /><span>適用</span></button>
                    <button onClick={() => setImageCropMode(false, null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={24} /></button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropOverlay;
