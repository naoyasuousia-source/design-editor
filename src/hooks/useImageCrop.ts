import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { imageCropService } from '@/services/image/imageCropService';

/**
 * Bridge (Hooks) 層: UI と Logic (imageCropService) / State (Store) を仲介
 */
export const useImageCrop = () => {
    const {
        isImageCropMode,
        croppingElementId,
        setImageCropMode,
        imageCropAspectRatio,
        zoom,
        setAutoSelectId
    } = useEditorStore();

    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null);
    const [targetFileName, setTargetFileName] = useState<string | null>(null);
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

    // 初期化ロジック
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

                        const contentW = (rect.width / zoom) - borderL - borderR - paddingL - (parseFloat(style.paddingRight) || 0);
                        const contentH = (rect.height / zoom) - borderT - borderB - paddingT - (parseFloat(style.paddingBottom) || 0);

                        let s = 1;
                        let offX = 0;
                        let offY = 0;

                        const bgImg = style.backgroundImage;
                        if (bgImg && bgImg !== 'none') {
                            const bgSizeStr = style.backgroundSize;
                            if (bgSizeStr.includes('px')) {
                                s = parseFloat(bgSizeStr.split(' ')[0]) / NW;
                            } else {
                                s = (parseFloat(bgSizeStr.split(' ')[0]) || 100) / 100 * contentW / NW;
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
                        setScreenPos({
                            left: rect.left + (borderL + paddingL + offX) * zoom,
                            top: rect.top + (borderT + paddingT + offY) * zoom
                        });

                        let finalW = fullW, finalH = fullH, startX = 0, startY = 0;
                        if (imageCropAspectRatio) {
                            if (fullW / fullH > imageCropAspectRatio) {
                                finalW = fullH * imageCropAspectRatio;
                                startX = (fullW - finalW) / 2;
                            } else {
                                finalH = fullW / imageCropAspectRatio;
                                startY = (fullH - finalH) / 2;
                            }
                        }
                        setCropRect({ x: startX, y: startY, width: finalW, height: finalH });
                        setTargetImageUrl(info.url);

                        const { imageUrls } = useEditorStore.getState();
                        let fileName = Object.entries(imageUrls).find(([_, u]) => u === info.url)?.[0];
                        if (!fileName) {
                            const m = info.url.match(/images\/([^?#)]+)/);
                            if (m) fileName = m[1].replace(/['"]/g, '');
                        }
                        setTargetFileName(fileName || null);
                    }
                });
                setCopiedStyle({ borderRadius: style.borderRadius });
            }
        } else {
            setTarget(null);
            setTargetImageUrl(null);
            setTargetFileName(null);
        }
    }, [isImageCropMode, croppingElementId, loadImageInfo, zoom, imageCropAspectRatio]);

    const handleApply = useCallback(() => {
        if (!target || naturalSize.width === 0) return;

        // 1. Logic層 (imageCropService) を使用してスタイルを計算
        const { imageUrls, setAutoSelectId } = useEditorStore.getState();

        let fileName = targetFileName;
        if (!fileName && targetImageUrl) {
            fileName = Object.entries(imageUrls).find(([_, u]) => u === targetImageUrl)?.[0] || '';
            if (!fileName) {
                const m = targetImageUrl.match(/images\/([^?#)]+)/);
                if (m) fileName = m[1].replace(/['"]/g, '');
            }
        }
        const relativePath = fileName ? `./images/${fileName}` : (targetImageUrl || '');

        const styles = imageCropService.calculateBackgroundStyles({
            cropRect,
            naturalSize,
            elementSize,
            url: relativePath
        });

        // 2. Logic層を使用して物理的な DOM 変換を実行
        const finalElement = imageCropService.applyCropToElement({
            target,
            styles,
            initialOffsets,
            cropRect
        });

        // 3. 確定合図としてストア更新 (Bridge層の役割)
        setImageCropMode(false, null);

        requestAnimationFrame(() => {
            finalElement.setAttribute('style', finalElement.style.cssText);
            window.dispatchEvent(new CustomEvent('canvas-update'));
            if (finalElement.id) {
                setAutoSelectId(finalElement.id);
            }
        });
    }, [target, naturalSize, cropRect, elementSize, targetFileName, targetImageUrl, initialOffsets, setImageCropMode, setAutoSelectId]);

    const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startRect: { ...cropRect } };
    }, [cropRect]);

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

    return {
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
    };
};
