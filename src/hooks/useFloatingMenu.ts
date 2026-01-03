import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export const useFloatingMenu = (targets: HTMLElement[], onUpdate: () => void) => {
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

    const { isResponsiveResize, setResponsiveResize } = useEditorStore();
    const target = targets[0];

    useEffect(() => {
        if (targets.length === 0) return;

        const updateRect = () => {
            if (targets.length === 1) {
                setRect(targets[0].getBoundingClientRect());
            } else {
                // 複数要素の最小/最大座標を計算してバウンディングボックスを作成
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

        // 全要素を監視
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
    }, [targets]);

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
        const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
        targets.forEach(el => el.setAttribute('data-group-id', groupId));
        onUpdate();
    }, [targets, onUpdate]);

    const handleUngroup = useCallback(() => {
        targets.forEach(el => el.removeAttribute('data-group-id'));
        onUpdate();
    }, [targets, onUpdate]);

    const toggleBold = useCallback(() => {
        if (!target) return;
        const currentWeight = window.getComputedStyle(target).fontWeight;
        const isBold = currentWeight === 'bold' || parseInt(currentWeight) >= 700;
        applyStyle('fontWeight', isBold ? 'normal' : 'bold');
    }, [target, applyStyle]);

    const openEyeDropper = async (propertyOrCallback: any = 'color') => {
        if (!('EyeDropper' in window)) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }
        try {
            // @ts-ignore
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();

            if (typeof propertyOrCallback === 'function') {
                propertyOrCallback(result.sRGBHex);
            } else {
                applyStyle(propertyOrCallback, result.sRGBHex);
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
        target,
        showImagePicker,
        setShowImagePicker,
        showCropPicker,
        setShowCropPicker,
        showColorPalette,
        setShowColorPalette,
        showBorderPalette,
        setShowBorderPalette,
        showBgPalette,
        setShowBgPalette,
        showRadiusPicker,
        setShowRadiusPicker,
        localRadius,
        setLocalRadius,
        showSizeDropdown,
        setShowSizeDropdown,
        showParagraphSettings,
        setShowParagraphSettings,
        showEffectSettings,
        setShowEffectSettings,
        showShadowPalette,
        setShowShadowPalette,
        showTextBgPalette,
        setShowTextBgPalette,
        showStrokePalette,
        setShowStrokePalette,
        isResponsiveResize,
        setResponsiveResize,
        applyStyle,
        handleGroup,
        handleUngroup,
        toggleBold,
        openEyeDropper,
        closeAllPanels
    };
};
