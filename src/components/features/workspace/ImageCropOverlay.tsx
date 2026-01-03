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
    const [elementSize, setElementSize] = useState({ width: 0, height: 0 });
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

                        const borderL = parseFloat(style.borderLeftWidth) || 0;
                        const borderT = parseFloat(style.borderTopWidth) || 0;
                        const borderR = parseFloat(style.borderRightWidth) || 0;
                        const borderB = parseFloat(style.borderBottomWidth) || 0;
                        const paddingL = parseFloat(style.paddingLeft) || 0;
                        const paddingT = parseFloat(style.paddingTop) || 0;
                        const paddingR = parseFloat(style.paddingRight) || 0;
                        const paddingB = parseFloat(style.paddingBottom) || 0;

                        const contentW = (rect.width / zoom) - borderL - borderR - paddingL - paddingR;
                        const contentH = (rect.height / zoom) - borderT - borderB - paddingT - paddingB;

                        let s = 1;
                        let offX = 0;
                        let offY = 0;

                        const bgImg = style.backgroundImage;
                        if (bgImg && bgImg !== 'none') {
                            const bgSizeStr = style.backgroundSize;
                            if (bgSizeStr.includes('px')) {
                                s = parseFloat(bgSizeStr.split(' ')[0]) / NW;
                            } else {
                                const pctW = parseFloat(bgSizeStr.split(' ')[0]) || 100;
                                s = (pctW / 100) * contentW / NW;
                            }

                            const bgPosStr = style.backgroundPosition;
                            if (bgPosStr.includes('px')) {
                                offX = parseFloat(bgPosStr.split(' ')[0]);
                                offY = parseFloat(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]);
                            } else {
                                const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
                                offX = (contentW - NW * s) * (parsePct(bgPosStr.split(' ')[0]) / 100);
                                offY = (contentH - NH * s) * (parsePct(bgPosStr.split(' ')[1] || bgPosStr.split(' ')[0]) / 100);
                            }
                        } else {
                            s = Math.max(contentW / NW, contentH / NH);
                            const parsePct = (v: string) => v.includes('%') ? parseFloat(v) : 50;
                            const pos = (style.objectPosition || '50% 50%').split(' ');
                            offX = (contentW - NW * s) * (parsePct(pos[0]) / 100);
                            offY = (contentH - NH * s) * (parsePct(pos[1] || pos[0]) / 100);
                        }

                        const fullW = NW * s;
                        const fullH = NH * s;

                        setNaturalSize({ width: NW, height: NH });
                        setElementSize({ width: fullW, height: fullH });
                        setInitialOffsets({ offX, offY });

                        // スクリーン座標: 元の要素のContent Boxの開始位置に、画像自体のオフセットを加える
                        setScreenPos({
                            left: rect.left + (borderL + paddingL + offX) * zoom,
                            top: rect.top + (borderT + paddingT + offY) * zoom
                        });

                        setCropRect({ x: 0, y: 0, width: fullW, height: fullH });
                        setTargetImageUrl(info.url);
                    }
                });

                setCopiedStyle({ borderRadius: style.borderRadius });
            }
        } else {
            setTarget(null);
            setTargetImageUrl('');
        }
    }, [isImageCropMode, croppingElementId, imageCropAspectRatio, loadImageInfo, zoom]);

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
                let w = startRect.width + deltaX;
                let h = startRect.height + deltaY;
                if (imageCropAspectRatio) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) h = w / imageCropAspectRatio;
                    else w = h * imageCropAspectRatio;
                }
                w = Math.max(10, Math.min(elementSize.width - startRect.x, w));
                h = Math.max(10, Math.min(elementSize.height - startRect.y, h));
                if (imageCropAspectRatio) {
                    if (w / h > imageCropAspectRatio) w = h * imageCropAspectRatio;
                    else h = w / imageCropAspectRatio;
                }
                next.width = w;
                next.height = h;
            }
            return next;
        });
    }, [target, zoom, elementSize, imageCropAspectRatio]);

    useEffect(() => {
        if (isImageCropMode) {
            const up = () => { isDragging.current = false; dragType.current = null; };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', up);
            return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', up); };
        }
    }, [isImageCropMode, handleMouseMove]);

    const handleApply = () => {
        if (!target || naturalSize.width === 0) return;

        const { x, y, width: cropW, height: cropH } = cropRect;
        const scale = elementSize.width / naturalSize.width;

        const bgSizeW = naturalSize.width * scale;
        const bgSizeH = naturalSize.height * scale;
        const bgPosX = -x;
        const bgPosY = -y;

        let finalTarget = target;
        if (target.tagName.toLowerCase() === 'img') {
            const div = document.createElement('div');
            Array.from(target.attributes).forEach(attr => { if (attr.name !== 'src') div.setAttribute(attr.name, attr.value); });
            target.parentNode?.replaceChild(div, target);
            finalTarget = div;
        }

        // 精密な移動量計算: 新しいクロップ開始位置と旧開始位置の差分
        const moveX = x + initialOffsets.offX;
        const moveY = y + initialOffsets.offY;

        const currentStyle = finalTarget.getAttribute('style') || '';
        let transStr = currentStyle.match(/transform:\s*([^;]+)/)?.[1] || finalTarget.style.transform || '';
        const tMatch = transStr.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        if (tMatch) {
            const bx = parseFloat(tMatch[1]); const by = parseFloat(tMatch[2]);
            transStr = transStr.replace(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/, `translate(${bx + moveX}px, ${by + moveY}px)`);
        } else {
            transStr = `${transStr} translate(${moveX}px, ${moveY}px)`.trim();
        }

        finalTarget.style.opacity = '0';
        finalTarget.style.width = `${cropW}px`;
        finalTarget.style.height = `${cropH}px`;
        finalTarget.style.transform = transStr;
        finalTarget.style.backgroundImage = `url('${targetImageUrl}')`;
        finalTarget.style.backgroundSize = `${bgSizeW}px ${bgSizeH}px`;
        finalTarget.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        finalTarget.style.backgroundRepeat = 'no-repeat';
        finalTarget.style.objectFit = '';
        finalTarget.style.objectPosition = '';

        setImageCropMode(false, null);
        requestAnimationFrame(() => {
            finalTarget.style.opacity = '1';
            finalTarget.setAttribute('style', finalTarget.style.cssText);
            window.dispatchEvent(new CustomEvent('canvas-update'));
        });
    };

    if (!isImageCropMode || !target) return null;

    const fullW = elementSize.width * zoom;
    const fullH = elementSize.height * zoom;

    return createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none">
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={() => setImageCropMode(false, null)} />

            {/* 背景ガイド（全体の完全静止画像） */}
            <div className="absolute pointer-events-none opacity-30 blur-[0.5px]" style={{ left: screenPos.left, top: screenPos.top, width: fullW, height: fullH }}>
                <img src={targetImageUrl} className="w-full h-full object-fill" style={copiedStyle} alt="" />
            </div>

            <div className="absolute pointer-events-none" style={{ left: screenPos.left, top: screenPos.top, width: fullW, height: fullH }}>
                {/* 選択枠: ズレを防ぐため border ではなく outline を使用し、内部画像の座標を純粋に保つ */}
                <div
                    className="absolute cursor-move pointer-events-auto outline outline-2 outline-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    style={{ left: cropRect.x * zoom, top: cropRect.y * zoom, width: cropRect.width * zoom, height: cropRect.height * zoom, overflow: 'hidden', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
                    onMouseDown={(e) => { e.stopPropagation(); isDragging.current = true; dragType.current = 'move'; dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startRect: { ...cropRect } }; }}
                >
                    {/* 内部画像: 親の outline (2px) に干渉されないよう、純粋なオフセットで配置 */}
                    <img src={targetImageUrl} className="absolute pointer-events-none" style={{ left: -cropRect.x * zoom, top: -cropRect.y * zoom, width: fullW, height: fullH, maxWidth: 'none', maxHeight: 'none', ...copiedStyle, objectFit: 'fill' }} alt="" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                        {[...Array(9)].map((_, i) => <div key={i} className="border-[0.5px] border-white" />)}
                    </div>
                </div>

                {/* リサイズハンドル */}
                <div
                    className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg cursor-nwse-resize pointer-events-auto flex items-center justify-center hover:scale-125 transition-transform z-10"
                    style={{ left: (cropRect.x + cropRect.width) * zoom - 12, top: (cropRect.y + cropRect.height) * zoom - 12 }}
                    onMouseDown={(e) => { e.stopPropagation(); isDragging.current = true; dragType.current = 'resize'; dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startRect: { ...cropRect } }; }}
                >
                    <Maximize2 size={12} className="text-white rotate-90" />
                </div>

                {/* ボタンユニット */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-sidebar/95 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl pointer-events-auto">
                    <button onClick={handleApply} className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-full transition-all shadow-lg active:scale-95"><Check size={20} /><span>適用</span></button>
                    <button onClick={() => setImageCropMode(false, null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropOverlay;
