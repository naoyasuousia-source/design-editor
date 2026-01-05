import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { imageCropService } from '@/services/image/imageCropService';
import { cropUtils } from '@/utils/image/cropUtils';
import type { CropRect } from '@/types/image';

/**
 * Bridge (Hooks) 層: UI と Logic/Action/State を仲介し、React のライフサイクルを管理する。
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

    // -- React State: UIの初期描画や最終結果の同期に使用 --
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null);
    const [targetFileName, setTargetFileName] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
    const [screenPos, setScreenPos] = useState({ top: 0, left: 0 });
    const [fullSize, setFullSize] = useState({ width: 0, height: 0 });
    const [copiedStyle, setCopiedStyle] = useState<React.CSSProperties>({});
    const [initialOffsets, setInitialOffsets] = useState({ offX: 0, offY: 0 });

    // -- Refs: 高頻度な更新（ドラッグ中）の副作用管理 --
    const isDragging = useRef(false);
    const dragType = useRef<'move' | 'resize' | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, startRect: { x: 0, y: 0, width: 0, height: 0 } });
    const currentCropRect = useRef<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

    // Temporary UI Refs (ImageCropOverlay から渡される)
    const cropBoxRef = useRef<HTMLDivElement | null>(null);
    const previewImgRef = useRef<HTMLImageElement | null>(null);
    const resizeHandleRef = useRef<HTMLDivElement | null>(null);

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

    // 初期設定とリセット
    useEffect(() => {
        if (!isImageCropMode || !croppingElementId) {
            setTarget(null);
            setTargetImageUrl(null);
            return;
        }

        const el = document.getElementById(croppingElementId);
        if (!el) return;

        setTarget(el);
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        loadImageInfo(el).then((info) => {
            if (!info) return;

            // Logic層 (utils) でレイアウト解析
            const layout = cropUtils.parseImageLayout({
                rect,
                style,
                naturalSize: { width: info.width, height: info.height },
                zoom
            });

            // 初期トリミング枠の計算
            const initialRect = cropUtils.calculateInitialCropRect(
                { width: layout.fullW, height: layout.fullH },
                imageCropAspectRatio
            );

            // State 同期
            setNaturalSize({ width: info.width, height: info.height });
            setFullSize({ width: layout.fullW, height: layout.fullH });
            setInitialOffsets({ offX: layout.offX, offY: layout.offY });
            setCropRect(initialRect);
            currentCropRect.current = initialRect;
            setScreenPos({
                left: rect.left + (layout.borders.left + layout.paddings.left + layout.offX) * zoom,
                top: rect.top + (layout.borders.top + layout.paddings.top + layout.offY) * zoom
            });
            setTargetImageUrl(info.url);

            const { imageUrls } = useEditorStore.getState();
            const fileName = Object.entries(imageUrls).find(([_, u]) => u === info.url)?.[0];
            setTargetFileName(fileName || null);
        });

        setCopiedStyle({ borderRadius: style.borderRadius });
    }, [isImageCropMode, croppingElementId, zoom, imageCropAspectRatio, loadImageInfo]);

    // マウスイベント：検知用
    const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
        e.stopPropagation();
        isDragging.current = true;
        dragType.current = type;
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startRect: { ...currentCropRect.current } };
    }, []);

    // マウスイベント：命令的操作 (Services) と 計算 (Utils)
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !dragType.current || !target) return;

        const deltaX = (e.clientX - dragStart.current.mouseX) / zoom;
        const deltaY = (e.clientY - dragStart.current.mouseY) / zoom;
        const { startRect } = dragStart.current;

        let nextRect = { ...currentCropRect.current };

        if (dragType.current === 'move') {
            const nextPos = cropUtils.calculateMove({ startRect, deltaX, deltaY, elementSize: fullSize });
            nextRect.x = nextPos.x;
            nextRect.y = nextPos.y;
        } else if (dragType.current === 'resize') {
            const nextSize = cropUtils.calculateResize({ startRect, deltaX, deltaY, elementSize: fullSize, aspectRatio: imageCropAspectRatio });
            nextRect.width = nextSize.width;
            nextRect.height = nextSize.height;
        }

        currentCropRect.current = nextRect;

        // Action層 (Services) を通じた命令的な DOM 更新 (React State を更新せず、反映速度を優先)
        if (cropBoxRef.current && previewImgRef.current && resizeHandleRef.current) {
            imageCropService.updatePreview({
                cropBox: cropBoxRef.current,
                previewImg: previewImgRef.current,
                resizeHandle: resizeHandleRef.current,
                cropRect: nextRect,
                fullSize,
                zoom
            });
        }
    }, [target, zoom, fullSize, imageCropAspectRatio]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        dragType.current = null;
        // 操作終了時に React State を同期 (Step 3: React Synchronization)
        setCropRect(currentCropRect.current);
    }, []);

    useEffect(() => {
        if (isImageCropMode) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isImageCropMode, handleMouseMove, handleMouseUp]);

    const handleApply = useCallback(async () => {
        if (!target || naturalSize.width === 0) return;

        // ストア内の正規な Blob URL を特定
        const { imageUrls, setAutoSelectId } = useEditorStore.getState();
        const fileName = targetFileName || Object.entries(imageUrls).find(([_, u]) => u === targetImageUrl)?.[0];
        const officialBlobUrl = fileName ? imageUrls[fileName] : targetImageUrl;
        const finalRect = currentCropRect.current;

        // 1. Logic層で最終スタイルを計算
        // DOM には常に現在の表示パス (Blob URL) を適用し、保存時のクリーンアップ層で相対パスに戻す
        const styles = cropUtils.generateBackgroundStyles({
            cropRect: finalRect,
            naturalSize,
            fullSize,
            url: officialBlobUrl || ''
        });

        // 2. Action層で物理的な DOM 変換を実行
        const finalElement = imageCropService.applyFinalCrop({
            target,
            styles,
            initialOffsets,
            cropRect: finalRect
        });

        // 3. 即座に最新の DOM 状態をストアに同期する (React の再レンダリング待ちによる先祖返りを防ぐ)
        const surface = target.closest('.DesignSurface');
        if (surface) {
            const { restoreRelativePaths } = await import('@/utils/html/cleaner');
            const clone = surface.cloneNode(true) as HTMLElement;
            // エディタ専用属性の除去などは cleaner の責務だが、ここでは最小限の同期を行う
            const cleanHtml = restoreRelativePaths(clone.innerHTML, imageUrls);
            useEditorStore.getState().setContent(cleanHtml, true); // 歴史には追加せず上書き
        }

        // 4. モード終了
        setImageCropMode(false, null);

        requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent('canvas-update'));
            if (finalElement.id) setAutoSelectId(finalElement.id);
        });
    }, [target, naturalSize, fullSize, targetFileName, targetImageUrl, initialOffsets, setImageCropMode, setAutoSelectId]);

    return {
        isImageCropMode,
        target,
        targetImageUrl,
        cropRect,
        screenPos,
        fullSize,
        copiedStyle,
        imageCropAspectRatio,
        croppingElementId,
        zoom,
        handleApply,
        handleMouseDown,
        setImageCropMode,
        // Refs for UI
        cropBoxRef,
        previewImgRef,
        resizeHandleRef
    };
};
