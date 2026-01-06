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

            // 属性値から直にファイル名を特定する試行
            const getFileNameFromPath = (path: string) => {
                const match = path.match(/images\/([^'()"\s?#]+)/);
                return match ? decodeURIComponent(match[1]) : null;
            };

            const attrPath = el.getAttribute('src') || window.getComputedStyle(el).backgroundImage || '';
            let detectedFileName = getFileNameFromPath(attrPath);

            // 見つからなければ URL マッピングから探す
            if (!detectedFileName) {
                detectedFileName = Object.entries(imageUrls).find(([_, u]) => u === info.url)?.[0] || null;
            }

            setTargetFileName(detectedFileName);
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

        let fileName = targetFileName;
        // 適用直前にも最新の imageUrls を使って再度ファイル名の特定を試みる (挿入直後のアセットに対応)
        if (!fileName) {
            fileName = Object.entries(imageUrls).find(([_, u]) => u === targetImageUrl)?.[0] || null;
        }

        const officialBlobUrl = fileName ? imageUrls[fileName] : targetImageUrl;
        const finalRect = currentCropRect.current;

        // 1. Logic層で最終スタイルと transform を計算
        const styles = cropUtils.generateBackgroundStyles({
            cropRect: finalRect,
            naturalSize,
            fullSize,
            url: officialBlobUrl || ''
        });

        const currentTransform = target.style.transform || window.getComputedStyle(target).transform || '';
        const finalTransform = cropUtils.calculateFinalTransform({
            currentTransform,
            cropRect: finalRect,
            initialOffsets
        });

        // 2. クローン DOM を使用して、仮想的に変換を適用し HTML を抽出する
        // 実 DOM (デザイン領域内) は一切書き換えず、React の再レンダリングのみに委ねる
        const surface = target.closest('.DesignSurface');
        if (surface) {
            // 一時的な属性を付与して、クローン内から確実に特定できるようにする
            target.setAttribute('data-cropping-target', 'true');

            const { restoreRelativePaths } = await import('@/utils/html/cleaner');
            const cloneSurface = surface.cloneNode(true) as HTMLElement;
            const clonedTarget = cloneSurface.querySelector('[data-cropping-target="true"]') as HTMLElement;

            // 実 DOM から属性を削除
            target.removeAttribute('data-cropping-target');

            if (clonedTarget) {
                // Action層をクローンに対して実行。戻り値として置換後の最新要素を取得。
                const processedElement = imageCropService.applyFinalCrop({
                    target: clonedTarget,
                    styles,
                    transform: finalTransform
                });

                // マーカー属性をクリーンアップ（置換後の要素からも確実に削除）
                processedElement.removeAttribute('data-cropping-target');

                // 重要: styles を適用しただけでは innerHTML に反映されない場合があるため、明示的に style 属性を更新
                processedElement.setAttribute('style', processedElement.style.cssText);

                // ストアへの同期
                const cleanHtml = restoreRelativePaths(cloneSurface.innerHTML, imageUrls);

                // --- デバッグログ: NaN や undefined の混入を確認 ---
                console.group('Image Crop: Final Sync Data');
                console.log('Final HTML:', cleanHtml);
                if (cleanHtml.includes('NaN') || cleanHtml.includes('undefined')) {
                    console.error('DETECTED INVALID VALUES (NaN/undefined) in final cleanHtml!');
                    const invalidMatches = cleanHtml.match(/[^a-zA-Z0-9](NaN|undefined)[^a-zA-Z0-9]/g);
                    console.error('Invalid segments:', invalidMatches);
                }
                console.log('Styles applied:', styles);
                console.log('Transform applied:', finalTransform);
                console.groupEnd();
                // ---------------------------------------------

                useEditorStore.getState().setContent(cleanHtml, true);
            }
        }

        // 3. モード終了
        setImageCropMode(false, null);

        // 最終的な描画は React が setContent による再レンダリングとして実行する
        requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent('canvas-update'));
            const finalEl = document.getElementById(target.id);
            if (finalEl) setAutoSelectId(finalEl.id);
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
