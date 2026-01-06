import React, { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';

interface IndividualMoveableProps {
    target: HTMLElement;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    getRenderDirections: () => string[];
    getBounds: () => { left: number; top: number; right: number; bottom: number } | undefined;
    currentWidth: number;
    currentHeight: number;
    moveableKeepRatio: boolean;
    zoom: number;
    isTextBox: (el: HTMLElement) => boolean;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    updateContentFromDOM: () => void;
    updateOverlayBounds: () => void;
    handleResizeStart: (e: { target: HTMLElement | SVGElement; direction: number[] }) => void;
    isRotationPickerOpen: boolean;
    setRotationPickerOpen: (open: boolean) => void;
    selectionMode: any;
    activeSubTarget: any;
    hoverTargets: any;
}

const IndividualMoveable: React.FC<IndividualMoveableProps> = (props) => {
    const {
        target,
        canvasRef,
        getRenderDirections,
        getBounds,
        currentWidth,
        currentHeight,
        moveableKeepRatio,
        zoom,
        isTextBox,
        expandCanvas,
        updateContentFromDOM,
        updateOverlayBounds,
        handleResizeStart,
        setRotationPickerOpen
    } = props;
    const moveableRef = useRef<Moveable>(null);
    const rotateStartTime = useRef<number>(0);
    const isRotating = useRef<boolean>(false);

    useEffect(() => {
        if (moveableRef.current) {
            moveableRef.current.updateRect();
        }
    }, [target]);

    return (
        <Moveable
            ref={moveableRef}
            target={target}
            container={canvasRef.current || undefined}
            draggable={true}
            resizable={true}
            rotatable={true}
            rotationPosition="bottom"
            renderDirections={getRenderDirections()}
            origin={false}
            snappable={true}
            bounds={getBounds() || {
                left: -2000,
                top: -2000,
                right: currentWidth + 2000,
                bottom: currentHeight + 2000,
            }}
            keepRatio={moveableKeepRatio || target.tagName.toLowerCase() === 'img' || Boolean(target.style.backgroundImage && target.style.backgroundImage.includes('url'))}
            throttleDrag={1}
            throttleResize={1}
            throttleRotate={0}
            zoom={1 / zoom}
            className="moveable-sub-selection"
            onDrag={e => {
                e.target.style.transform = e.transform;
                const rect = e.target.getBoundingClientRect();
                const canvasRect = canvasRef.current?.getBoundingClientRect();
                if (canvasRect) {
                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                }
                updateOverlayBounds();
            }}
            onDragEnd={() => {
                updateContentFromDOM();
                updateOverlayBounds();
            }}
            onResize={e => {
                const el = e.target as HTMLElement;
                const { width, height, drag, direction } = e;
                const isText = isTextBox(el);

                el.style.width = `${width}px`;
                el.style.height = isText ? 'auto' : `${height}px`;
                el.style.transform = drag.transform;

                if (isText) {
                    const isCorner = direction[0] !== 0 && direction[1] !== 0;
                    if (isCorner) {
                        const startW = parseFloat(el.getAttribute('data-start-w') || '0');
                        if (startW > 0) {
                            const ratio = width / startW;
                            const startFsAttr = el.getAttribute('data-start-fs');
                            const startFs = startFsAttr ? parseFloat(startFsAttr) : parseFloat(window.getComputedStyle(el).fontSize);
                            el.style.fontSize = `${startFs * ratio}px`;
                        }
                    }
                    el.style.height = `${el.scrollHeight}px`;
                }

                const rect = el.getBoundingClientRect();
                const canvasRect = canvasRef.current?.getBoundingClientRect();
                if (canvasRect) {
                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                }
                updateOverlayBounds();
            }}
            onResizeStart={handleResizeStart}
            onResizeEnd={() => {
                updateContentFromDOM();
                updateOverlayBounds();
            }}
            onRotateStart={() => {
                rotateStartTime.current = Date.now();
                isRotating.current = false;
            }}
            onRotate={e => {
                isRotating.current = true;
                e.target.style.transform = e.drag.transform;
                updateOverlayBounds();
            }}
            onRotateEnd={() => {
                const duration = Date.now() - rotateStartTime.current;
                if (duration < 250 && !isRotating.current) {
                    setRotationPickerOpen(true);
                } else {
                    updateContentFromDOM();
                    updateOverlayBounds();
                }
            }}
        />
    );
};

export default IndividualMoveable;
