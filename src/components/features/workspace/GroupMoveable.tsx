import React from 'react';
import Moveable from 'react-moveable';
import type { SelectionMode } from '@/hooks/moveable/useSelection';

interface GroupMoveableProps {
    targets: HTMLElement[];
    canvasRef: React.RefObject<HTMLDivElement | null>;
    groupOverlay: HTMLDivElement | null;
    selectionKey: string;
    selectionMode: SelectionMode;
    currentWidth: number;
    currentHeight: number;
    zoom: number;
    getBounds: () => { left: number; top: number; right: number; bottom: number } | undefined;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    updateOverlayBounds: () => void;
    updateContentFromDOM: () => void;
}

const GroupMoveable: React.FC<GroupMoveableProps> = ({
    targets,
    canvasRef,
    groupOverlay,
    selectionKey,
    selectionMode,
    currentWidth,
    currentHeight,
    zoom,
    getBounds,
    expandCanvas,
    updateOverlayBounds,
    updateContentFromDOM
}) => {
    if (!groupOverlay) return null;

    return (
        <Moveable
            key={selectionKey}
            target={groupOverlay}
            container={canvasRef.current || undefined}
            draggable={selectionMode === 'group'}
            resizable={selectionMode === 'group'}
            renderDirections={selectionMode === 'group' ? ["nw", "ne", "sw", "se"] : []}
            origin={false}
            snappable={selectionMode === 'group'}
            bounds={getBounds() || {
                left: -2000,
                top: -2000,
                right: currentWidth + 2000,
                bottom: currentHeight + 2000,
            }}
            keepRatio={true}
            throttleDrag={1}
            throttleResize={1}
            zoom={1 / zoom}
            hideChildMoveableControls={false}
            className="moveable-group-selection"
            onDrag={e => {
                e.target.style.transform = e.transform;
                const deltaX = e.delta[0];
                const deltaY = e.delta[1];
                targets.forEach(el => {
                    const currentLeft = parseFloat(el.style.left) || el.offsetLeft;
                    const currentTop = parseFloat(el.style.top) || el.offsetTop;
                    el.style.left = `${currentLeft + deltaX}px`;
                    el.style.top = `${currentTop + deltaY}px`;
                });

                let maxR = 0, maxB = 0;
                targets.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                        maxR = Math.max(maxR, (rect.right - canvasRect.left) / zoom);
                        maxB = Math.max(maxB, (rect.bottom - canvasRect.top) / zoom);
                    }
                });
                if (maxR > 0 || maxB > 0) expandCanvas(maxR, maxB);
            }}
            onDragEnd={() => {
                if (groupOverlay) {
                    groupOverlay.style.transform = '';
                    updateOverlayBounds();
                }
                updateContentFromDOM();
            }}
            onResizeStart={e => {
                targets.forEach(el => {
                    el.setAttribute('data-start-w', el.offsetWidth.toString());
                    el.setAttribute('data-start-h', el.offsetHeight.toString());
                    el.setAttribute('data-start-l', (parseFloat(el.style.left) || el.offsetLeft).toString());
                    el.setAttribute('data-start-t', (parseFloat(el.style.top) || el.offsetTop).toString());
                    el.setAttribute('data-start-fs', window.getComputedStyle(el).fontSize);
                });
                const overlayEl = e.target as HTMLElement;
                overlayEl.setAttribute('data-start-w', overlayEl.offsetWidth.toString());
                overlayEl.setAttribute('data-start-h', overlayEl.offsetHeight.toString());
                overlayEl.setAttribute('data-start-l', overlayEl.style.left);
                overlayEl.setAttribute('data-start-t', overlayEl.style.top);
            }}
            onResize={e => {
                const overlayTarget = e.target as HTMLElement;
                const { width, height, drag } = e;

                overlayTarget.style.width = `${width}px`;
                overlayTarget.style.height = `${height}px`;

                const beforeTranslate = drag.beforeTranslate;
                const startL = parseFloat(overlayTarget.getAttribute('data-start-l') || '0');
                const startT = parseFloat(overlayTarget.getAttribute('data-start-t') || '0');
                const newLeft = startL + beforeTranslate[0];
                const newTop = startT + beforeTranslate[1];
                overlayTarget.style.left = `${newLeft}px`;
                overlayTarget.style.top = `${newTop}px`;

                const startW = parseFloat(overlayTarget.getAttribute('data-start-w') || '1');
                const ratio = width / startW;

                const overlayStartL = parseFloat(overlayTarget.getAttribute('data-start-l') || '0');
                const overlayStartT = parseFloat(overlayTarget.getAttribute('data-start-t') || '0');

                targets.forEach(el => {
                    const ew = parseFloat(el.getAttribute('data-start-w') || '0');
                    const eh = parseFloat(el.getAttribute('data-start-h') || '0');
                    const elft = parseFloat(el.getAttribute('data-start-l') || '0');
                    const et = parseFloat(el.getAttribute('data-start-t') || '0');
                    const efs = parseFloat(el.getAttribute('data-start-fs') || '16');

                    const relativeL = elft - overlayStartL;
                    const relativeT = et - overlayStartT;

                    el.style.width = `${ew * ratio}px`;
                    el.style.height = `${eh * ratio}px`;
                    el.style.left = `${newLeft + relativeL * ratio}px`;
                    el.style.top = `${newTop + relativeT * ratio}px`;
                    el.style.fontSize = `${efs * ratio}px`;
                });

                let maxR = 0, maxB = 0;
                targets.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                        maxR = Math.max(maxR, (rect.right - canvasRect.left) / zoom);
                        maxB = Math.max(maxB, (rect.bottom - canvasRect.top) / zoom);
                    }
                });
                if (maxR > 0 || maxB > 0) expandCanvas(maxR, maxB);
            }}
            onResizeEnd={() => {
                if (groupOverlay) {
                    groupOverlay.style.transform = '';
                    updateOverlayBounds();
                }
                updateContentFromDOM();
            }}
        />
    );
};

export default GroupMoveable;
