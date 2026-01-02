import { useState, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

export const useSelection = (canvasRef: RefObject<HTMLDivElement | null>, content: string) => {
    const [targets, setTargetsState] = useState<HTMLElement[]>([]);

    const setTargets = useCallback((newTargets: HTMLElement[] | ((prev: HTMLElement[]) => HTMLElement[])) => {
        setTargetsState(prev => {
            const next = typeof newTargets === 'function' ? newTargets(prev) : newTargets;
            prev.forEach(el => el.classList.remove('moveable-target-active'));
            next.forEach(el => el.classList.add('moveable-target-active'));
            return next;
        });
    }, []);

    // デザインの更新に合わせて DOM 要素を再取得する
    useEffect(() => {
        if (targets.length === 0) return;

        const surface = canvasRef.current?.querySelector('.DesignSurface');
        if (!surface) return;

        const nextTargets: HTMLElement[] = [];
        let hasChanged = false;

        targets.forEach(target => {
            if (document.body.contains(target)) {
                nextTargets.push(target);
            } else if (target.id) {
                const refreshed = surface.querySelector(`[id="${target.id}"]`);
                if (refreshed instanceof HTMLElement) {
                    nextTargets.push(refreshed);
                    hasChanged = true;
                }
            }
        });

        if (hasChanged) {
            setTargets(nextTargets);
        }
    }, [content, canvasRef]);

    const isTextBox = useCallback((el: HTMLElement) => {
        if (el.tagName.toLowerCase() === 'img') return false;
        return el.children.length === 0;
    }, []);

    const getRenderDirections = useCallback(() => {
        if (targets.length === 0) return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];
        const first = targets[0];
        if (isTextBox(first)) {
            return ["nw", "ne", "sw", "se", "w", "e"];
        }
        return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];
    }, [targets, isTextBox]);

    return {
        targets,
        setTargets,
        isTextBox,
        getRenderDirections
    };
};
