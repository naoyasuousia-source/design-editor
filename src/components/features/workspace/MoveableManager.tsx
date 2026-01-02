import React from 'react';
import Moveable from 'react-moveable';

interface MoveableManagerProps {
    targets: HTMLElement[];
    canvasRef: React.RefObject<HTMLDivElement | null>;
    isEditing: boolean;
    getRenderDirections: () => string[];
    getBounds: () => { left: number; top: number; right: number; bottom: number } | undefined;
    currentWidth: number;
    currentHeight: number;
    moveableKeepRatio: boolean;
    zoom: number;
    expandCanvas: (neededWidth: number, neededHeight: number) => void;
    isTextBox: (el: HTMLElement) => boolean;
    isResponsiveResize: boolean;
    handleResizeStart: (e: { target: HTMLElement; direction: number[] }) => void;
    updateContentFromDOM: () => void;
}

const MoveableManager: React.FC<MoveableManagerProps> = ({
    targets,
    canvasRef,
    isEditing,
    getRenderDirections,
    getBounds,
    currentWidth,
    currentHeight,
    moveableKeepRatio,
    zoom,
    expandCanvas,
    isTextBox,
    isResponsiveResize,
    handleResizeStart,
    updateContentFromDOM
}) => {
    return (
        <Moveable
            target={targets}
            container={canvasRef.current || undefined}
            draggable={!isEditing}
            resizable={true}
            renderDirections={getRenderDirections()}
            origin={false}
            snappable={true}
            bounds={getBounds() || {
                left: -2000,
                top: -2000,
                right: currentWidth + 2000,
                bottom: currentHeight + 2000,
            }}
            keepRatio={moveableKeepRatio || targets.some(el => el.tagName.toLowerCase() === 'img')}
            throttleDrag={1}
            throttleResize={1}
            zoom={1 / zoom}
            onDrag={e => {
                e.target.style.transform = e.transform;
                const rect = e.target.getBoundingClientRect();
                const canvasRect = canvasRef.current?.getBoundingClientRect();
                if (canvasRect) {
                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                }
            }}
            onDragGroup={e => {
                let maxR = 0;
                let maxB = 0;
                e.events.forEach(ev => {
                    ev.target.style.transform = ev.transform;
                    const rect = ev.target.getBoundingClientRect();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                        maxR = Math.max(maxR, (rect.right - canvasRect.left) / zoom);
                        maxB = Math.max(maxB, (rect.bottom - canvasRect.top) / zoom);
                    }
                });
                if (maxR > 0 || maxB > 0) expandCanvas(maxR, maxB);
            }}
            onResize={e => {
                const target = e.target as HTMLElement;
                let { width, height } = e;
                const { drag, direction } = e;
                const isText = isTextBox(target);

                if (!isResponsiveResize) {
                    const minW = parseFloat(target.getAttribute('data-min-w') || '0');
                    const minH = parseFloat(target.getAttribute('data-min-h') || '0');

                    if (minW > 0 && direction[0] !== 0) width = Math.max(width, minW);
                    if (minH > 0 && direction[1] !== 0) height = Math.max(height, minH);
                }

                if (isText) target.style.padding = '0';

                target.style.width = `${width}px`;
                target.style.transform = drag.transform;

                const [dh, dv] = direction;
                const isSide = (dh !== 0 && dv === 0);

                if (isText && isSide) {
                    target.style.height = 'auto';
                    const newHeight = target.scrollHeight;
                    target.style.height = `${newHeight}px`;
                } else {
                    target.style.height = `${height}px`;

                    const startW = parseFloat(target.getAttribute('data-start-w') || '0');
                    const startH = parseFloat(target.getAttribute('data-start-h') || '0');

                    if (startW > 0 && startH > 0) {
                        const totalRatioW = width / startW;
                        const totalRatioH = height / startH;

                        if (isResponsiveResize && target.children.length > 0) {
                            Array.from(target.children).forEach(child => {
                                const el = child as HTMLElement;
                                const cw = parseFloat(el.getAttribute('data-start-w') || '0');
                                const ch = parseFloat(el.getAttribute('data-start-h') || '0');
                                const cl = parseFloat(el.getAttribute('data-start-l') || '0');
                                const ct = parseFloat(el.getAttribute('data-start-t') || '0');
                                const cfs = parseFloat(el.getAttribute('data-start-fs') || '0');

                                if (cw > 0) {
                                    el.style.width = `${cw * totalRatioW}px`;
                                    el.style.height = `${ch * totalRatioH}px`;
                                    el.style.left = `${cl * totalRatioW}px`;
                                    el.style.top = `${ct * totalRatioH}px`;
                                    if (cfs > 0) el.style.fontSize = `${cfs * (totalRatioW + totalRatioH) / 2}px`;
                                }
                            });
                        }

                        if (isText) {
                            const startFs = parseFloat(target.getAttribute('data-start-fs') || window.getComputedStyle(target).fontSize);
                            target.style.fontSize = `${startFs * totalRatioW}px`;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }
                    }
                }

                target.setAttribute('data-last-width', width.toString());
                target.setAttribute('data-last-height', target.offsetHeight.toString());

                const rect = target.getBoundingClientRect();
                const canvasRect = canvasRef.current?.getBoundingClientRect();
                if (canvasRect) {
                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                }
            }}
            onResizeGroup={e => {
                e.events.forEach(ev => {
                    const target = ev.target as HTMLElement;
                    let { width, height, drag } = ev;

                    if (!isResponsiveResize) {
                        const minW = parseFloat(target.getAttribute('data-min-w') || '0');
                        const minH = parseFloat(target.getAttribute('data-min-h') || '0');
                        if (minW > 0) width = Math.max(width, minW);
                        if (minH > 0) height = Math.max(height, minH);
                    }

                    target.style.width = `${width}px`;
                    target.style.height = `${height}px`;
                    target.style.transform = drag.transform;

                    const lastWidth = parseFloat(target.getAttribute('data-last-width') || target.style.width);
                    if (lastWidth > 0) {
                        const ratio = width / lastWidth;
                        const currentFontSize = parseFloat(window.getComputedStyle(target).fontSize);
                        target.style.fontSize = `${currentFontSize * ratio}px`;
                    }
                    target.setAttribute('data-last-width', width.toString());
                });
            }}
            onResizeStart={handleResizeStart}
            onResizeGroupStart={e => {
                e.events.forEach(ev => {
                    const target = ev.target as HTMLElement;
                    target.setAttribute('data-last-width', target.offsetWidth.toString());
                    target.setAttribute('data-last-height', target.offsetHeight.toString());

                    if (!isResponsiveResize && target.children.length > 0) {
                        let maxR = 0;
                        let maxB = 0;
                        Array.from(target.children).forEach(child => {
                            const el = child as HTMLElement;
                            const w = el.offsetWidth;
                            const h = el.offsetHeight;
                            const l = el.offsetLeft;
                            const t = el.offsetTop;
                            const fs = parseFloat(window.getComputedStyle(el).fontSize);

                            el.style.width = `${w}px`;
                            el.style.height = `${h}px`;
                            el.style.left = `${l}px`;
                            el.style.top = `${t}px`;
                            el.style.fontSize = `${fs}px`;

                            maxR = Math.max(maxR, l + w);
                            maxB = Math.max(maxB, t + h);
                        });
                        target.setAttribute('data-min-w', maxR.toString());
                        target.setAttribute('data-min-h', maxB.toString());
                    }
                });
            }}
            onResizeEnd={updateContentFromDOM}
            onDragEnd={updateContentFromDOM}
            className="SelectionTool"
        />
    );
};

export default MoveableManager;
