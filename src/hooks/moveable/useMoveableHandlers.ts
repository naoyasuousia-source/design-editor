import React, { useCallback, useRef } from 'react';
import type { SelectionMode } from '@/hooks/moveable/useSelection';

interface UseMoveableHandlersProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    isLocked: boolean;
    isEditing: boolean;
    isEditingRef: React.RefObject<boolean>;
    editingElementRef: React.RefObject<HTMLElement | null>;
    targets: HTMLElement[];
    selectionMode: SelectionMode;
    setTargets: (targets: HTMLElement[]) => void;
    setSelectionMode: (mode: SelectionMode) => void;
    setActiveSubTarget: (target: HTMLElement | null) => void;
    activeSubTarget: HTMLElement | null;
    setHoverTargets: (targets: HTMLElement[]) => void;
    finishEditing: () => void;
    handleDoubleClick: (e: React.MouseEvent) => void;
    selectNone: () => void;
}

export const useMoveableHandlers = ({
    canvasRef,
    isLocked,
    isEditing,
    isEditingRef,
    editingElementRef,
    targets,
    selectionMode,
    activeSubTarget,
    setTargets,
    setSelectionMode,
    setActiveSubTarget,
    setHoverTargets,
    finishEditing,
    handleDoubleClick,
    selectNone
}: UseMoveableHandlersProps) => {
    const lastMouseDownPos = useRef<{ x: number, y: number } | null>(null);
    const wasAlreadySelectedRef = useRef<boolean>(false);

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (isLocked) return;

        let target = e.target as HTMLElement;
        const isShift = e.shiftKey;
        lastMouseDownPos.current = { x: e.clientX, y: e.clientY };

        // Moveableのコントロールやオーバーレイをクリックした場合の透過処理
        if (!target.closest('.DesignSurface')) {
            const overlays = canvasRef.current?.querySelectorAll('.group-selection-overlay, .hover-selection-overlay, .existing-group-overlay, .moveable-control-box') || [];

            const originalStyles = Array.from(overlays).map(el => (el as HTMLElement).style.pointerEvents);
            overlays.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
            const underlying = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            overlays.forEach((el, i) => (el as HTMLElement).style.pointerEvents = originalStyles[i]);

            if (underlying && underlying.closest('.DesignSurface')) {
                target = underlying;
            } else {
                if (!isShift) selectNone();
                return;
            }
        }

        if (e.detail === 2) {
            e.stopPropagation();
            handleDoubleClick(e);
            return;
        }

        if (isEditingRef.current && editingElementRef.current) {
            if (editingElementRef.current.contains(target) || editingElementRef.current === target) {
                return;
            }
            finishEditing();
        }

        if (target.classList.contains('DesignSurface')) {
            if (!isShift) selectNone();
            return;
        }

        // デザインサーフェス内の要素を特定
        let el = target.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement | null;
        if (!el) return;

        // data-group-id を持つ最上位の親要素を探す
        const surface = el.closest('.DesignSurface') as HTMLElement;
        let current: HTMLElement | null = el;
        let groupedEl: HTMLElement | null = null;
        while (current && current !== surface) {
            if (current.getAttribute('data-group-id')) {
                groupedEl = current;
            }
            current = current.parentElement;
        }
        el = groupedEl || el;

        if (el) {
            const groupId = el.getAttribute('data-group-id');
            const groupElements = groupId
                ? Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${groupId}"]`) || []) as HTMLElement[]
                : [el];

            if (isShift) {
                wasAlreadySelectedRef.current = false;
                const hasAll = groupElements.every(el => targets.includes(el));
                const nextTargets = hasAll
                    ? targets.filter(el => !groupElements.includes(el))
                    : Array.from(new Set([...targets, ...groupElements]));

                setTargets(nextTargets);

                const firstGid = nextTargets[0]?.getAttribute('data-group-id');
                const isSameGroup = nextTargets.length > 1 &&
                    firstGid !== null &&
                    nextTargets.every(t => t.getAttribute('data-group-id') === firstGid);

                setSelectionMode(isSameGroup ? 'group' : 'individual');
                setActiveSubTarget(null);
            } else {
                if (groupId) {
                    const isAlreadyGroupSelected = targets.length === groupElements.length &&
                        targets.every(t => t.getAttribute('data-group-id') === groupId);

                    const isSameElementClicked = activeSubTarget === el;

                    // 1. グループ選択中、または同じ要素の個別選択中の場合のみ、MouseUpでの個別切替を許可するフラグを立てる
                    if (isAlreadyGroupSelected && (selectionMode === 'group' || (selectionMode === 'individual' && isSameElementClicked))) {
                        wasAlreadySelectedRef.current = selectionMode === 'group';
                        return;
                    } else {
                        // 2. 別の要素をクリックしたか、新規選択の場合は、強制的にグループ選択に戻す
                        // この際、wasAlreadySelectedRef を false にすることで、MouseUp での即座な個別切替を阻止する
                        setTargets(groupElements);
                        setSelectionMode('group');
                        setActiveSubTarget(null);
                        wasAlreadySelectedRef.current = false;
                    }
                } else {
                    wasAlreadySelectedRef.current = false;
                    setTargets([el]);
                    setSelectionMode('individual');
                    setActiveSubTarget(el);
                }
            }
        }
    }, [isLocked, canvasRef, finishEditing, handleDoubleClick, setTargets, targets, selectNone, setSelectionMode, setActiveSubTarget, isEditingRef, editingElementRef, selectionMode, activeSubTarget]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (isLocked || !lastMouseDownPos.current) return;

        if (e.shiftKey || (targets.length > 1 && selectionMode === 'individual')) {
            lastMouseDownPos.current = null;
            return;
        }

        const dx = e.clientX - lastMouseDownPos.current.x;
        const dy = e.clientY - lastMouseDownPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        lastMouseDownPos.current = null;

        if (distance > 5) return;

        let target = e.target as HTMLElement;

        // Moveableのコントロールやオーバーレイをクリックした場合の透過処理
        if (!target.closest('.DesignSurface')) {
            const overlays = canvasRef.current?.querySelectorAll('.group-selection-overlay, .hover-selection-overlay, .existing-group-overlay, .moveable-control-box') || [];
            if (overlays.length > 0) {
                const originalStyles = Array.from(overlays).map(el => (el as HTMLElement).style.pointerEvents);
                overlays.forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
                const underlying = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                overlays.forEach((el, i) => (el as HTMLElement).style.pointerEvents = originalStyles[i]);

                if (underlying && underlying.closest('.DesignSurface')) {
                    target = underlying;
                } else {
                    return;
                }
            }
        }

        // デザインサーフェス内の要素を特定
        let el = target.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement | null;
        if (!el || el.classList.contains('DesignSurface')) return;

        // data-group-id を持つ最上位の親要素を探す
        const surface = el.closest('.DesignSurface') as HTMLElement;
        let current: HTMLElement | null = el;
        let groupedEl: HTMLElement | null = null;
        while (current && current !== surface) {
            if (current.getAttribute('data-group-id')) {
                groupedEl = current;
            }
            current = current.parentElement;
        }
        el = groupedEl || el;

        const groupId = el.getAttribute('data-group-id');
        if (groupId) {
            const groupElements = Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${groupId}"]`) || []) as HTMLElement[];
            const isTargetInCurrentGroup = targets.length === groupElements.length &&
                targets.every(t => t.getAttribute('data-group-id') === groupId);

            if (isTargetInCurrentGroup) {
                // selectionMode が group であり、かつ MouseDown 時に既にそのグループが選択されていた場合のみ個別選択へ移行
                if (selectionMode === 'group' && wasAlreadySelectedRef.current) {
                    setSelectionMode('individual');
                    setActiveSubTarget(el);
                }
                // selectionMode が individual だった場合は、MouseDown 側のロジックで既に group に戻されているか、
                // 同一要素クリックなら何もしない（ドラッグ維持）ため、ここでは追加処理不要
            } else if (!isTargetInCurrentGroup) {
                setTargets(groupElements);
                setSelectionMode('group');
                setActiveSubTarget(null);
            }
        } else {
            setTargets([el]);
            setSelectionMode('individual');
            setActiveSubTarget(el);
        }
    }, [isLocked, selectionMode, targets, canvasRef, setSelectionMode, setActiveSubTarget, setTargets]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isLocked || isEditing) return;

        const target = e.target as HTMLElement;
        const surface = target.closest('.DesignSurface');
        if (!surface || target === surface) {
            setHoverTargets([]);
            return;
        }

        let el: HTMLElement | null = target;
        let foundGroupId: string | null = null;
        while (el && el !== surface) {
            const gid = el.getAttribute('data-group-id');
            if (gid) {
                foundGroupId = gid;
                break;
            }
            el = el.parentElement;
        }

        if (foundGroupId) {
            const groupElements = Array.from(surface.querySelectorAll(`[data-group-id="${foundGroupId}"]`)) as HTMLElement[];
            const isAlreadySelected = targets.length === groupElements.length &&
                groupElements.every(elem => targets.includes(elem));

            if (isAlreadySelected) {
                setHoverTargets([]);
            } else {
                setHoverTargets(groupElements);
            }
        } else {
            setHoverTargets([]);
        }
    }, [isLocked, isEditing, targets, setHoverTargets]);

    const handleMouseLeave = useCallback(() => {
        setHoverTargets([]);
    }, [setHoverTargets]);

    return {
        handleCanvasClick,
        handleMouseUp,
        handleMouseMove,
        handleMouseLeave
    };
};
