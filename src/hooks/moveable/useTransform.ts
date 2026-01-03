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

        if (target.children.length > 0) {
            let maxR = 0;
            let maxB = 0;
            Array.from(target.children).forEach(child => {
                const el = child as HTMLElement;
                const w = el.offsetWidth;
                const h = el.offsetHeight;
                const l = el.offsetLeft;
                const t = el.offsetTop;
                const fs = parseFloat(window.getComputedStyle(el).fontSize);

                el.setAttribute('data-start-w', w.toString());
                el.setAttribute('data-start-h', h.toString());
                el.setAttribute('data-start-l', l.toString());
                el.setAttribute('data-start-t', t.toString());
                el.setAttribute('data-start-fs', fs.toString());

                if (!isResponsiveResize) {
                    el.style.width = `${w}px`;
                    el.style.height = `${h}px`;
                    el.style.left = `${l}px`;
                    el.style.top = `${t}px`;
                    el.style.fontSize = `${fs}px`;
                }

                maxR = Math.max(maxR, l + w);
                maxB = Math.max(maxB, t + h);
            });

            if (!isResponsiveResize) {
                target.setAttribute('data-min-w', maxR.toString());
                target.setAttribute('data-min-h', maxB.toString());
            } else {
                target.removeAttribute('data-min-w');
                target.removeAttribute('data-min-h');
            }
        }
    }, [isResponsiveResize, isTextBox]);

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
