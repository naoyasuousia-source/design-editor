import { useState, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { elementService } from '@/services/elementService';

export type SelectionMode = 'none' | 'group' | 'individual';

export const useSelection = (canvasRef: RefObject<HTMLDivElement | null>, content: string) => {
    const [targets, setTargetsState] = useState<HTMLElement[]>([]);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
    const [activeSubTarget, setActiveSubTarget] = useState<HTMLElement | null>(null);
    const [hoverTargets, setHoverTargets] = useState<HTMLElement[]>([]);

    const setTargets = useCallback((newTargets: HTMLElement[] | ((prev: HTMLElement[]) => HTMLElement[])) => {
        setTargetsState(prev => {
            const next = typeof newTargets === 'function' ? newTargets(prev) : newTargets;

            // 旧ターゲットからクラス除去
            prev.filter(el => !next.includes(el)).forEach(el => {
                el.classList.remove('moveable-target-active');
            });
            // 新ターゲットにクラス付与
            next.filter(el => !prev.includes(el)).forEach(el => {
                el.classList.add('moveable-target-active');
            });

            return next;
        });
    }, []);

    // 選択解除を含めたセット関数
    const selectNone = useCallback(() => {
        setTargets([]);
        setSelectionMode('none');
        setActiveSubTarget(null);
    }, [setTargets]);

    const isTextBox = useCallback((el: HTMLElement) => {
        if (el.tagName.toLowerCase() === 'img') return false;
        // background-imageを持つdivも画像扱い
        if (el.style.backgroundImage && el.style.backgroundImage.includes('url')) return false;

        return el.textContent?.trim() !== '' &&
            (el.children.length === 0 ||
                Array.from(el.children).every(c =>
                    ['br', 'span'].includes(c.tagName.toLowerCase()) ||
                    (['div', 'p'].includes(c.tagName.toLowerCase()) && !c.id)
                ));
    }, []);

    const getRenderDirections = useCallback(() => {
        if (selectionMode === 'group') {
            return ["nw", "ne", "sw", "se"]; // コーナーのみ
        }
        if (targets.length === 0) return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];

        const mainTarget = activeSubTarget || targets[0];

        // 画像判定
        const isImage = mainTarget.tagName.toLowerCase() === 'img' ||
            (mainTarget.style.backgroundImage && mainTarget.style.backgroundImage.includes('url'));

        if (isImage) {
            return ["nw", "ne", "sw", "se"]; // 画像はコーナーのみ
        }

        if (isTextBox(mainTarget)) {
            return ["nw", "ne", "sw", "se", "w", "e"];
        }
        return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];
    }, [targets, selectionMode, activeSubTarget, isTextBox]);

    // グローバルな選択状態（レイヤー同期用）の更新
    useEffect(() => {
        const ids = targets.map(el => el.id);
        if (activeSubTarget && activeSubTarget.id && !ids.includes(activeSubTarget.id)) {
            ids.push(activeSubTarget.id);
        }
        useEditorStore.getState().setSelectedIds(ids);
    }, [targets, activeSubTarget]);

    // グローバルな選択解除リクエストへの対応
    const isDeselectTriggered = useEditorStore(state => state.isDeselectTriggered);
    const resetDeselectTrigger = useEditorStore(state => state.resetDeselectTrigger);
    useEffect(() => {
        if (isDeselectTriggered) {
            selectNone();
            resetDeselectTrigger();
        }
    }, [isDeselectTriggered, selectNone, resetDeselectTrigger]);


    // デザインの更新に合わせて DOM 要素を再取得する
    useEffect(() => {
        if (targets.length === 0) return;

        const surface = canvasRef.current?.querySelector('.DesignSurface');
        if (!surface) return;

        const nextTargets: HTMLElement[] = [];
        let hasChanged = false;

        targets.forEach(target => {
            if (canvasRef.current?.contains(target)) {
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

        // activeSubTarget の更新
        if (activeSubTarget && !canvasRef.current?.contains(activeSubTarget) && activeSubTarget.id) {
            const refreshedSub = surface.querySelector(`[id="${activeSubTarget.id}"]`);
            if (refreshedSub instanceof HTMLElement) {
                setActiveSubTarget(refreshedSub);
            } else {
                setActiveSubTarget(null);
            }
        }
    }, [content, canvasRef, activeSubTarget]);

    return {
        targets,
        setTargets,
        selectNone,
        selectionMode,
        setSelectionMode,
        activeSubTarget,
        setActiveSubTarget,
        hoverTargets,
        setHoverTargets,
        isTextBox,
        getRenderDirections
    };
};
