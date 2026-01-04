import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import type { SelectionMode } from '@/hooks/moveable/useSelection';

export type MenuType = 'text' | 'image' | 'shape';

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

    const { setResponsiveResize, setImageCropMode } = useEditorStore();
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

    const targetType = useMemo((): MenuType => {
        const t = effectiveTarget;
        if (!t) return 'shape';
        const tagName = t.tagName.toLowerCase();
        const isImage = tagName === 'img' || (t.style.backgroundImage && t.style.backgroundImage.includes('url'));
        if (isImage) return 'image';

        const isText = t.textContent?.trim() !== '' &&
            (t.children.length === 0 ||
                Array.from(t.children).every(c =>
                    ['br', 'span'].includes(c.tagName.toLowerCase()) ||
                    (['div', 'p'].includes(c.tagName.toLowerCase()) && !c.id)
                ));
        return isText ? 'text' : 'shape';
    }, [effectiveTarget]);

    const gid = targets[0]?.getAttribute('data-group-id');
    const isGrouped = targets.length > 1 && gid !== null && targets.every(el => el.getAttribute('data-group-id') === gid);
    const canGroup = targets.length > 1 && !isGrouped;
    const groupId = isGrouped ? gid : null;

    const applyStyle = useCallback((property: keyof CSSStyleDeclaration, value: string, shouldUpdateStore = true) => {
        targets.forEach(el => {
            let cssProperty = (property as string).replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            if (cssProperty.startsWith('webkit-')) {
                cssProperty = `-${cssProperty}`;
            }
            el.style.setProperty(cssProperty, value);
        });
        if (shouldUpdateStore) onUpdate();
    }, [targets, onUpdate]);

    const handleGroup = useCallback(() => {
        const id = `group-${Math.random().toString(36).substr(2, 9)}`;
        targets.forEach(el => el.setAttribute('data-group-id', id));
        onUpdate();
    }, [targets, onUpdate]);

    const handleUngroup = useCallback(() => {
        targets.forEach(el => el.removeAttribute('data-group-id'));
        if (onClearSelection) onClearSelection();
        onUpdate();
    }, [targets, onUpdate, onClearSelection]);

    const handleDelete = useCallback(() => {
        targets.forEach(el => el.remove());
        if (onClearSelection) onClearSelection();
        onUpdate();
    }, [targets, onUpdate, onClearSelection]);

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
        toggleBold,
        openEyeDropper,
        closeAllPanels
    };
};

