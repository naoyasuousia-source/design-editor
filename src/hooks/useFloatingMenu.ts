import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import { getTargetType } from '@/utils/domUtils';
import type { TargetType } from '@/utils/domUtils';
import { elementService } from '@/services/elementService';

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
        toggleBold,
        openEyeDropper,
        closeAllPanels
    };
};

