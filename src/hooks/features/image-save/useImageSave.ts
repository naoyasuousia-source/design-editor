import { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useEditorStore } from '@/store/useEditorStore';
import { htmlService } from '@/services/htmlService';

export const useImageSave = () => {
    const {
        setImageSaveMode,
        isImageSaveMode,
        cropAspectRatio,
        setCropAspectRatio,
        zoom
    } = useEditorStore();

    const [isCropping, setIsCropping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTransparent, setIsTransparent] = useState(false);

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

    useEffect(() => {
        if (isCropping && cropAspectRatio && cropAspectRatio !== 'free') {
            setCropRect(prev => {
                let newWidth = prev.width;
                let newHeight = newWidth / (cropAspectRatio as number);

                if (newHeight > surfaceBounds.height) {
                    newHeight = surfaceBounds.height;
                    newWidth = newHeight * (cropAspectRatio as number);
                }

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
                dataUrl = await toPng(surface, {
                    canvasWidth: cropRect.width,
                    canvasHeight: cropRect.height,
                    width: cropRect.width,
                    height: cropRect.height,
                    pixelRatio: 2,
                    backgroundColor: isTransparent ? undefined : '#ffffff',
                    style: {
                        transform: `scale(1) translate(${-cropRect.x}px, ${-cropRect.y}px)`,
                        transformOrigin: 'top left',
                        width: surface.offsetWidth + 'px',
                        height: surface.offsetHeight + 'px',
                    },
                });
            } else {
                dataUrl = await toPng(surface, {
                    pixelRatio: 2,
                    backgroundColor: isTransparent ? undefined : '#ffffff'
                });
            }

            htmlService.downloadImage(dataUrl, `design-${Date.now()}.png`);

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
                    const ratio = cropAspectRatio as number;
                    if (newWidth / newHeight > ratio) {
                        newWidth = newHeight * ratio;
                    } else {
                        newHeight = newWidth / ratio;
                    }

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

    return {
        isCropping, setIsCropping,
        isSaving, isTransparent, setIsTransparent,
        cropRect, surfaceBounds,
        zoom, cropAspectRatio, setCropAspectRatio,
        handleCancel, handleSave, handleMouseDown,
        isImageSaveMode
    };
};
