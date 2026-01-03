import { useState, useCallback } from 'react';
import type { RefObject } from 'react';

export const useTransform = (
    canvasRef: RefObject<HTMLDivElement | null>,
    targets: HTMLElement[],
    zoom: number,
    isResponsiveResize: boolean,
    isTextBox: (el: HTMLElement) => boolean
) => {
    const [keepRatio, setKeepRatio] = useState(false);

    const handleResizeStart = useCallback((e: { target: HTMLElement | SVGElement; direction: number[] }) => {
        const target = e.target as HTMLElement;
        const [h, v] = e.direction;
        const isCorner = h !== 0 && v !== 0;
        setKeepRatio(isCorner);

        const startW = target.offsetWidth;
        const startH = target.offsetHeight;
        target.setAttribute('data-start-w', startW.toString());
        target.setAttribute('data-start-h', startH.toString());
        target.setAttribute('data-last-width', startW.toString());
        target.setAttribute('data-last-height', startH.toString());

        if (isTextBox(target)) {
            const fs = parseFloat(window.getComputedStyle(target).fontSize);
            target.setAttribute('data-start-fs', fs.toString());
        }
    }, [isTextBox]);

    const getBounds = useCallback(() => {
        if (targets.length === 0) return undefined;
        const first = targets[0];
        const parent = first.parentElement;
        if (!parent) return undefined;

        const canvasRect = canvasRef.current?.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        if (!canvasRect) return undefined;

        return {
            left: (parentRect.left - canvasRect.left) / zoom,
            top: (parentRect.top - canvasRect.top) / zoom,
            right: (parentRect.right - canvasRect.left) / zoom,
            bottom: (parentRect.bottom - canvasRect.top) / zoom,
        };
    }, [targets, canvasRef, zoom]);

    return {
        keepRatio,
        setKeepRatio,
        handleResizeStart,
        getBounds
    };
};
