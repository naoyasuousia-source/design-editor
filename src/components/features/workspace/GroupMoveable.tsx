import React, { useState, useRef } from 'react';
import Moveable from 'react-moveable';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import { getElementRotation, rotatePoint } from '@/utils/rotationUtils';
import RotationPicker from './RotationPicker';

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
    tick: number;
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
    updateContentFromDOM,
    tick
}) => {
    const moveableRef = React.useRef<Moveable>(null);
    const [rotationPickerPos, setRotationPickerPos] = useState<{ x: number; y: number } | null>(null);
    const rotateStartTime = useRef<number>(0);
    const isRotating = useRef<boolean>(false);

    React.useEffect(() => {
        setRotationPickerPos(null);
    }, [targets]);

    React.useEffect(() => {
        if (moveableRef.current) {
            moveableRef.current.updateRect();
        }
    }, [tick]);

    if (!groupOverlay) return null;

    return (
        <>
            <Moveable
                ref={moveableRef}
                key={selectionKey}
                target={groupOverlay}
                container={canvasRef.current || undefined}
                draggable={selectionMode === 'group'}
                resizable={selectionMode === 'group'}
                rotatable={selectionMode === 'group'}
                rotationPosition="bottom"
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
                throttleRotate={0}
                zoom={1 / zoom}
                className="moveable-group-selection"
                onDragStart={e => {
                    targets.forEach(el => {
                        el.setAttribute('data-start-l', (parseFloat(el.style.left) || el.offsetLeft).toString());
                        el.setAttribute('data-start-t', (parseFloat(el.style.top) || el.offsetTop).toString());
                    });
                    const overlayEl = e.target as HTMLElement;
                    overlayEl.setAttribute('data-start-l', (parseFloat(overlayEl.style.left) || overlayEl.offsetLeft).toString());
                    overlayEl.setAttribute('data-start-t', (parseFloat(overlayEl.style.top) || overlayEl.offsetTop).toString());
                }}
                onDrag={e => {
                    const overlayTarget = e.target as HTMLElement;
                    const { beforeTranslate } = e;
                    const startL = parseFloat(overlayTarget.getAttribute('data-start-l') || '0');
                    const startT = parseFloat(overlayTarget.getAttribute('data-start-t') || '0');
                    const newL = startL + beforeTranslate[0];
                    const newT = startT + beforeTranslate[1];

                    overlayTarget.style.left = `${newL}px`;
                    overlayTarget.style.top = `${newT}px`;

                    const deltaX = beforeTranslate[0];
                    const deltaY = beforeTranslate[1];

                    targets.forEach(el => {
                        const elStartL = parseFloat(el.getAttribute('data-start-l') || '0');
                        const elStartT = parseFloat(el.getAttribute('data-start-t') || '0');
                        el.style.left = `${elStartL + deltaX}px`;
                        el.style.top = `${elStartT + deltaY}px`;
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
                    updateContentFromDOM();
                    updateOverlayBounds();
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
                    updateContentFromDOM();
                    updateOverlayBounds();
                }}
                onRotateStart={e => {
                    rotateStartTime.current = Date.now();
                    isRotating.current = false;
                    const overlayEl = e.target as HTMLElement;

                    // オーバーレイの中心を取得
                    const rect = overlayEl.getBoundingClientRect();
                    const containerRect = canvasRef.current!.getBoundingClientRect();
                    const cx = (rect.left + rect.width / 2 - containerRect.left) / zoom;
                    const cy = (rect.top + rect.height / 2 - containerRect.top) / zoom;

                    overlayEl.setAttribute('data-center-x', cx.toString());
                    overlayEl.setAttribute('data-center-y', cy.toString());
                    overlayEl.setAttribute('data-start-rotate', getElementRotation(overlayEl).toString());

                    targets.forEach(el => {
                        el.setAttribute('data-start-l', (parseFloat(el.style.left) || el.offsetLeft).toString());
                        el.setAttribute('data-start-t', (parseFloat(el.style.top) || el.offsetTop).toString());
                        el.setAttribute('data-start-rotate', getElementRotation(el).toString());
                    });
                }}
                onRotate={e => {
                    isRotating.current = true;
                    const overlayTarget = e.target as HTMLElement;
                    const { beforeRotate } = e;
                    overlayTarget.style.transform = e.drag.transform;

                    const cx = parseFloat(overlayTarget.getAttribute('data-center-x') || '0');
                    const cy = parseFloat(overlayTarget.getAttribute('data-center-y') || '0');
                    const deltaRotate = beforeRotate;

                    targets.forEach(el => {
                        const startL = parseFloat(el.getAttribute('data-start-l') || '0');
                        const startT = parseFloat(el.getAttribute('data-start-t') || '0');
                        const startRotate = parseFloat(el.getAttribute('data-start-rotate') || '0');

                        // 座標の回転
                        const newPos = rotatePoint(startL, startT, cx, cy, deltaRotate);
                        el.style.left = `${newPos.x}px`;
                        el.style.top = `${newPos.y}px`;

                        // 要素自体の回転を更新
                        const newRotate = startRotate + deltaRotate;
                        const elTransform = el.style.transform || '';
                        if (elTransform.includes('rotate(')) {
                            el.style.transform = elTransform.replace(/rotate\(([-\d.]+)deg\)/, `rotate(${newRotate}deg)`);
                        } else {
                            el.style.transform = `${elTransform} rotate(${newRotate}deg)`.trim();
                        }
                    });
                    updateOverlayBounds();
                }}
                onRotateEnd={e => {
                    const duration = Date.now() - rotateStartTime.current;
                    if (duration < 250 && !isRotating.current) {
                        setRotationPickerPos({ x: e.inputEvent.clientX, y: e.inputEvent.clientY });
                    } else {
                        updateContentFromDOM();
                        updateOverlayBounds();
                    }
                }}
            />
            {
                rotationPickerPos && (
                    <RotationPicker
                        targets={[groupOverlay!, ...targets]}
                        position={rotationPickerPos}
                        onUpdate={(newPos?: { x: number; y: number }) => {
                            updateContentFromDOM();
                            // リセット時などはオーバーレイの回転も戻す必要があるため、手動でリセット
                            if (groupOverlay) groupOverlay.style.transform = 'rotate(0deg)';
                            updateOverlayBounds();
                            if (newPos) {
                                setRotationPickerPos(newPos);
                            }
                        }}
                        onClose={() => setRotationPickerPos(null)}
                    />
                )
            }
        </>
    );
};

export default GroupMoveable;
