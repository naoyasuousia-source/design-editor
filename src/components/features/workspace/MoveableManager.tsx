import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import GroupMoveable from './GroupMoveable';
import IndividualMoveable from './IndividualMoveable';

interface MoveableManagerProps {
    targets: HTMLElement[];
    canvasRef: React.RefObject<HTMLDivElement | null>;
    getRenderDirections: () => string[];
    getBounds: () => { left: number; top: number; right: number; bottom: number } | undefined;
    currentWidth: number;
    currentHeight: number;
    moveableKeepRatio: boolean;
    zoom: number;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    isTextBox: (el: HTMLElement) => boolean;
    selectionMode: SelectionMode;
    activeSubTarget: HTMLElement | null;
    hoverTargets: HTMLElement[];
    handleResizeStart: (e: { target: HTMLElement | SVGElement; direction: number[] }) => void;
    updateContentFromDOM: () => void;
}

const calculateGroupBounds = (elements: HTMLElement[], container: HTMLElement | null) => {
    if (elements.length === 0 || !container) return null;
    const cr = container.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        const r = el.getBoundingClientRect();
        minX = Math.min(minX, r.left - cr.left);
        minY = Math.min(minY, r.top - cr.top);
        maxX = Math.max(maxX, r.right - cr.left);
        maxY = Math.max(maxY, r.bottom - cr.top);
    });
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
};

const MoveableManager: React.FC<MoveableManagerProps> = (props) => {
    const { targets, canvasRef, selectionMode, activeSubTarget, hoverTargets } = props;
    const [hoverOverlay, setHoverOverlay] = useState<HTMLDivElement | null>(null);
    const [groupOverlay, setGroupOverlay] = useState<HTMLDivElement | null>(null);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        if (!canvasRef.current) return;
        let overlay = hoverOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = "absolute pointer-events-none border-2 border-orange-500 hidden z-[9998]";
            canvasRef.current.appendChild(overlay);
            setHoverOverlay(overlay);
        }
        if (hoverTargets.length > 0) {
            const b = calculateGroupBounds(hoverTargets, canvasRef.current);
            if (b) {
                overlay.style.display = 'block';
                overlay.style.left = `${b.left}px`;
                overlay.style.top = `${b.top}px`;
                overlay.style.width = `${b.width}px`;
                overlay.style.height = `${b.height}px`;
            }
        } else {
            overlay.style.display = 'none';
        }
    }, [hoverTargets, canvasRef, hoverOverlay]);

    useEffect(() => {
        if (!canvasRef.current) return;
        let overlay = groupOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = "absolute hidden z-[9999]";
            canvasRef.current.appendChild(overlay);
            setGroupOverlay(overlay);
        }
        const hasGroup = targets.length > 0 && targets[0]?.getAttribute('data-group-id');
        if ((selectionMode === 'group' || selectionMode === 'individual') && hasGroup) {
            const b = calculateGroupBounds(targets, canvasRef.current);
            if (b) {
                overlay.style.display = 'block';
                overlay.style.left = `${b.left}px`;
                overlay.style.top = `${b.top}px`;
                overlay.style.width = `${b.width}px`;
                overlay.style.height = `${b.height}px`;
                if (selectionMode === 'group') {
                    overlay.classList.remove('pointer-events-none');
                } else {
                    overlay.classList.add('pointer-events-none');
                }
            }
        } else {
            overlay.style.display = 'none';
        }
        forceUpdate({});
    }, [targets, selectionMode, canvasRef, groupOverlay]);

    useEffect(() => {
        return () => {
            hoverOverlay?.remove();
            groupOverlay?.remove();
        };
    }, [hoverOverlay, groupOverlay]);

    const updateOverlayBounds = useCallback(() => {
        if (!groupOverlay || !canvasRef.current) return;
        const b = calculateGroupBounds(targets, canvasRef.current);
        if (b) {
            groupOverlay.style.left = `${b.left}px`;
            groupOverlay.style.top = `${b.top}px`;
            groupOverlay.style.width = `${b.width}px`;
            groupOverlay.style.height = `${b.height}px`;
        }
    }, [groupOverlay, targets, canvasRef]);

    const selectionKey = useMemo(() => `${selectionMode}-${targets.map(t => t.id).join(',')}`, [selectionMode, targets]);
    const showGroupMoveable = groupOverlay && (targets.length > 1 || (targets.length > 0 && targets[0]?.getAttribute('data-group-id'))) &&
        (selectionMode === 'group' || selectionMode === 'individual') && groupOverlay.style.display !== 'none';

    return (
        <>
            {showGroupMoveable && (
                <GroupMoveable
                    {...props}
                    groupOverlay={groupOverlay}
                    selectionKey={selectionKey}
                    updateOverlayBounds={updateOverlayBounds}
                />
            )}

            {selectionMode === 'individual' && activeSubTarget && (
                <IndividualMoveable
                    {...props}
                    target={activeSubTarget}
                    updateOverlayBounds={updateOverlayBounds}
                />
            )}
        </>
    );
};

export default MoveableManager;
