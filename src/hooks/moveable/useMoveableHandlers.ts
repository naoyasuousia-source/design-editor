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

        if (!target.closest('.DesignSurface')) {
            const groupOverlay = canvasRef.current?.querySelector('.group-selection-overlay') as HTMLElement;
            const hoverOverlay = canvasRef.current?.querySelector('.hover-selection-overlay') as HTMLElement;
            const overlaysToHide = [target];
            if (groupOverlay) overlaysToHide.push(groupOverlay);
            if (hoverOverlay) overlaysToHide.push(hoverOverlay);
            const controlBox = canvasRef.current?.querySelector('.moveable-control-box') as HTMLElement;
            if (controlBox) overlaysToHide.push(controlBox);

            const originalStyles = overlaysToHide.map(el => el.style.pointerEvents);
            overlaysToHide.forEach(el => el.style.pointerEvents = 'none');
            const underlying = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            overlaysToHide.forEach((el, i) => el.style.pointerEvents = originalStyles[i]);

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

        let el: HTMLElement | null = target;
        const surface = el.closest('.DesignSurface');
        if (!surface || el === surface) return;

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

                    wasAlreadySelectedRef.current = isAlreadyGroupSelected && selectionMode === 'group';

                    if (isAlreadyGroupSelected && selectionMode === 'group') {
                        return;
                    } else {
                        setTargets(groupElements);
                        setSelectionMode('group');
                        setActiveSubTarget(null);
                    }
                } else {
                    wasAlreadySelectedRef.current = false;
                    setTargets([el]);
                    setSelectionMode('individual');
                    setActiveSubTarget(el);
                }
            }
        }
    }, [isLocked, canvasRef, finishEditing, handleDoubleClick, setTargets, targets, selectNone, setSelectionMode, setActiveSubTarget, isEditingRef, editingElementRef]);

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
        if (!target.closest('.DesignSurface')) {
            const groupOverlay = canvasRef.current?.querySelector('.group-selection-overlay') as HTMLElement;
            const hoverOverlay = canvasRef.current?.querySelector('.hover-selection-overlay') as HTMLElement;
            const overlaysToHide = [target];
            if (groupOverlay) overlaysToHide.push(groupOverlay);
            if (hoverOverlay) overlaysToHide.push(hoverOverlay);
            const controlBox = canvasRef.current?.querySelector('.moveable-control-box') as HTMLElement;
            if (controlBox) overlaysToHide.push(controlBox);

            const originalStyles = overlaysToHide.map(el => el.style.pointerEvents);
            overlaysToHide.forEach(el => el.style.pointerEvents = 'none');
            const underlying = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            overlaysToHide.forEach((el, i) => el.style.pointerEvents = originalStyles[i]);

            if (underlying && underlying.closest('.DesignSurface')) {
                target = underlying;
            } else {
                return;
            }
        }

        const el = target.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement;
        if (!el || el.classList.contains('DesignSurface')) return;

        const groupId = el.getAttribute('data-group-id');
        if (groupId) {
            const groupElements = Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${groupId}"]`) || []) as HTMLElement[];
            const isTargetInCurrentGroup = targets.length === groupElements.length &&
                targets.every(t => t.getAttribute('data-group-id') === groupId);

            if (isTargetInCurrentGroup && selectionMode === 'group' && wasAlreadySelectedRef.current) {
                setSelectionMode('individual');
                setActiveSubTarget(el);
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
