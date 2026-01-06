import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import { getTargetType } from '@/utils/domUtils';
import type { TargetType } from '@/utils/domUtils';
import { elementService } from '@/services/elementService';
import { backgroundRemovalService } from '@/services/image/backgroundRemovalService';
import { useAssets } from '@/hooks/useAssets';
import { fileSystemService } from '@/services/fileSystem';

interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>;
}

declare global {
    interface Window {
        EyeDropper: {
            new(): EyeDropper;
        };
    }
}
export const useFloatingMenu = (
    targets: HTMLElement[],
    onUpdate: () => void,
    canvasRef: React.RefObject<HTMLDivElement | null>,
    onClearSelection?: () => void,
    selectionMode: SelectionMode = 'none',
    activeSubTarget: HTMLElement | null = null
) => {
    const { refreshAssets } = useAssets();
    const projectDirectoryHandle = useEditorStore(state => state.projectDirectoryHandle);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showCropPicker, setShowCropPicker] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showBorderPalette, setShowBorderPalette] = useState(false);
    const [showBgPalette, setShowBgPalette] = useState(false);
    const [showRadiusPicker, setShowRadiusPicker] = useState(false);
    const [localRadius, setLocalRadius] = useState<number | null>(null);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const [showParagraphSettings, setShowParagraphSettings] = useState(false);
    const [showEffectSettings, setShowEffectSettings] = useState(false);
    const [showShadowPalette, setShowShadowPalette] = useState(false);
    const [showTextBgPalette, setShowTextBgPalette] = useState(false);
    const [showStrokePalette, setShowStrokePalette] = useState(false);

    const { setResponsiveResize, setImageCropMode, setAutoSelectId } = useEditorStore();
    const effectiveTarget = (selectionMode === 'individual' && activeSubTarget) ? activeSubTarget : targets[0];

    useEffect(() => {
        if (targets.length === 0) return;

        const updateRect = () => {
            if (selectionMode === 'individual' && activeSubTarget) {
                setRect(activeSubTarget.getBoundingClientRect());
            } else if (targets.length === 1) {
                setRect(targets[0].getBoundingClientRect());
            } else {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                targets.forEach(el => {
                    const r = el.getBoundingClientRect();
                    minX = Math.min(minX, r.left);
                    minY = Math.min(minY, r.top);
                    maxX = Math.max(maxX, r.right);
                    maxY = Math.max(maxY, r.bottom);
                });

                if (minX !== Infinity) {
                    setRect(new DOMRect(minX, minY, maxX - minX, maxY - minY));
                }
            }
        };

        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);

        const observers = targets.map(el => {
            const obs = new MutationObserver(updateRect);
            obs.observe(el, { attributes: true, subtree: true, characterData: true });
            return obs;
        });

        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
            observers.forEach(obs => obs.disconnect());
        };
    }, [targets, selectionMode, activeSubTarget]);

    const targetType = useMemo((): TargetType => {
        return getTargetType(effectiveTarget);
    }, [effectiveTarget]);

    const gid = targets[0]?.getAttribute('data-group-id');
    const isGrouped = targets.length > 1 && gid !== null && targets.every(el => el.getAttribute('data-group-id') === gid);
    const canGroup = targets.length > 1 && !isGrouped;
    const groupId = isGrouped ? gid : null;

    const applyStyle = useCallback((property: keyof CSSStyleDeclaration, value: string, shouldUpdateStore = true) => {
        elementService.applyStyle(targets, property as string, value);
        if (shouldUpdateStore) onUpdate();
    }, [targets, onUpdate]);

    const handleGroup = useCallback(() => {
        const id = elementService.groupElements(targets);
        onUpdate();
        // グループ化直後に新グループを自動選択する
        if (id && targets.length > 0 && targets[0].id) {
            setAutoSelectId(targets[0].id);
        }
    }, [targets, onUpdate, setAutoSelectId]);

    const handleUngroup = useCallback(() => {
        elementService.ungroupElements(targets);
        if (onClearSelection) onClearSelection();
        onUpdate();
    }, [targets, onUpdate, onClearSelection]);

    const handleDelete = useCallback(() => {
        elementService.deleteElements(targets);
        if (onClearSelection) onClearSelection();
        onUpdate();
    }, [targets, onUpdate, onClearSelection]);

    const handleDuplicate = useCallback(() => {
        if (targets.length === 0 || !canvasRef.current) return;

        const designSurface = canvasRef.current.querySelector('.DesignSurface') as HTMLElement;
        if (!designSurface) return;

        const firstCloneId = elementService.duplicateElements(targets, designSurface);

        onUpdate();

        if (firstCloneId) {
            setAutoSelectId(firstCloneId);
        }
    }, [targets, onUpdate, setAutoSelectId, canvasRef]);

    const toggleBold = useCallback(() => {
        const t = effectiveTarget;
        if (!t) return;
        const currentWeight = window.getComputedStyle(t).fontWeight;
        const isBold = currentWeight === 'bold' || parseInt(currentWeight) >= 700;
        applyStyle('fontWeight', isBold ? 'normal' : 'bold');
    }, [effectiveTarget, applyStyle]);


    const openEyeDropper = async (propertyOrCallback: ((color: string) => void) | keyof CSSStyleDeclaration = 'color') => {
        if (!('EyeDropper' in window)) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();

            if (typeof propertyOrCallback === 'function') {
                propertyOrCallback(result.sRGBHex);
            } else {
                applyStyle(propertyOrCallback as keyof CSSStyleDeclaration, result.sRGBHex);
            }
        } catch (e) {
            console.error('EyeDropper failed:', e);
        }
    };

    const closeAllPanels = useCallback(() => {
        setShowColorPalette(false);
        setShowBorderPalette(false);
        setShowBgPalette(false);
        setShowRadiusPicker(false);
        setShowCropPicker(false);
        setShowImagePicker(false);
        setShowSizeDropdown(false);
        setShowParagraphSettings(false);
        setShowEffectSettings(false);
        setShowShadowPalette(false);
        setShowTextBgPalette(false);
        setShowStrokePalette(false);
    }, []);

    const handleRemoveBackground = useCallback(async () => {
        if (!effectiveTarget || getTargetType(effectiveTarget) !== 'image') return;

        let url = '';
        const isImgTag = effectiveTarget.tagName.toLowerCase() === 'img';

        if (isImgTag) {
            url = (effectiveTarget as HTMLImageElement).src;
        } else {
            const bg = window.getComputedStyle(effectiveTarget).backgroundImage;
            const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) url = match[1];
        }

        if (!url) {
            console.error('[handleRemoveBackground] No URL found for target');
            return;
        }

        try {
            const transparentUrl = await backgroundRemovalService.removeBackground(url);

            if (projectDirectoryHandle) {
                try {
                    // 1. 画像データをBlobとして取得
                    const response = await fetch(transparentUrl);
                    const blob = await response.blob();

                    // 2. ユニークなファイル名を生成
                    const getFileNameFromUrl = (u: string) => {
                        const { imageUrls } = useEditorStore.getState();
                        const entry = Object.entries(imageUrls).find(([_, val]) => val === u);
                        if (entry) return entry[0];
                        const match = u.match(/images\/([^'()"\s?#]+)/);
                        return match ? decodeURIComponent(match[1]) : null;
                    };
                    const originalName = getFileNameFromUrl(url) || 'image.png';
                    const baseName = originalName.split('.')[0];
                    const newFileName = `${baseName}_transparent_${Date.now().toString(36)}.png`;

                    // 3. images フォルダに物理保存
                    console.log('[handleRemoveBackground] Saving to FS...');
                    const imagesHandle = await fileSystemService.ensureImagesDirectory(projectDirectoryHandle);
                    const fileHandle = await imagesHandle.getFileHandle(newFileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    console.log('[handleRemoveBackground] FS Save complete.');

                    // 4. アセット一覧を最新状態に更新
                    await refreshAssets(true);

                    // 5. ストアの content 文字列を直接書き換えて参照を切り替える
                    // これにより、DOMからの吸い出し時に発生するパスの先祖返りを防ぐ
                    const newUrl = `./images/${newFileName}`;
                    const targetId = effectiveTarget.id;

                    if (targetId) {
                        const { content: currentContent, setContent } = useEditorStore.getState();
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = currentContent;
                        const targetInContent = tempDiv.querySelector(`[id="${targetId}"]`);

                        if (targetInContent) {
                            if (isImgTag) {
                                targetInContent.setAttribute('src', newUrl);
                            } else {
                                (targetInContent as HTMLElement).style.backgroundImage = `url('${newUrl}')`;
                            }
                            (targetInContent as HTMLElement).style.backgroundColor = 'transparent';

                            // 更新されたHTMLをストアに書き戻す
                            // ここで setContent を呼ぶと、React が自動的に再レンダリングをトリガーするため、
                            // onUpdate() は呼ばない（呼ぶとDOMから古いパスを吸い出して上書きしてしまう）
                            setContent(tempDiv.innerHTML);
                        }
                    }

                    // ストア更新後、実DOMにも透過画像を反映（表示のため）
                    // ただし、ここでは Blob URL を使う（ストアには相対パスが保存されている）
                    const newBlobUrl = useEditorStore.getState().imageUrls[newFileName];
                    if (newBlobUrl) {
                        if (isImgTag) {
                            (effectiveTarget as HTMLImageElement).src = newBlobUrl;
                        } else {
                            effectiveTarget.style.backgroundImage = `url('${newBlobUrl}')`;
                        }
                        effectiveTarget.style.backgroundColor = 'transparent';
                    }

                } catch (saveErr) {
                    console.error('[handleRemoveBackground] Save failed:', saveErr);
                }
            } else {
                // プロジェクトフォルダ未選択時は、メモリ上の Blob URL のみを適用
                if (isImgTag) (effectiveTarget as HTMLImageElement).src = transparentUrl;
                else elementService.applyStyle([effectiveTarget], 'backgroundImage', `url('${transparentUrl}')`);
                elementService.applyStyle([effectiveTarget], 'backgroundColor', 'transparent');
                onUpdate();
            }
        } catch (e) {
            console.error('[handleRemoveBackground] Global Error:', e);
            alert('背景除去に失敗しました。');
        }
    }, [effectiveTarget, onUpdate, projectDirectoryHandle, refreshAssets]);

    return {
        rect,
        target: effectiveTarget,
        targetType,
        isGrouped,
        canGroup,
        groupId,
        showImagePicker, setShowImagePicker,
        showCropPicker, setShowCropPicker,
        showColorPalette, setShowColorPalette,
        showBorderPalette, setShowBorderPalette,
        showBgPalette, setShowBgPalette,
        showRadiusPicker, setShowRadiusPicker,
        localRadius, setLocalRadius,
        showSizeDropdown, setShowSizeDropdown,
        showParagraphSettings, setShowParagraphSettings,
        showEffectSettings, setShowEffectSettings,
        showShadowPalette, setShowShadowPalette,
        showTextBgPalette, setShowTextBgPalette,
        showStrokePalette, setShowStrokePalette,
        setResponsiveResize,
        setImageCropMode,
        applyStyle,
        handleGroup,
        handleUngroup,
        handleDelete,
        handleDuplicate,
        handleRemoveBackground,
        toggleBold,
        openEyeDropper,
        closeAllPanels
    };
};

