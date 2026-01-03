import React from 'react';
import Moveable from 'react-moveable';
import type { SelectionMode } from '@/hooks/moveable/useSelection';

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

const MoveableManager: React.FC<MoveableManagerProps> = ({
    targets,
    canvasRef,
    getRenderDirections,
    getBounds,
    currentWidth,
    currentHeight,
    moveableKeepRatio,
    zoom,
    expandCanvas,
    isTextBox,
    selectionMode,
    activeSubTarget,
    hoverTargets,
    handleResizeStart,
    updateContentFromDOM
}) => {
    // グループ全体をレスポンシブにリサイズするヘルパー
    const handleGroupResize = (e: any) => {
        const { width } = e;

        // 基準となる全体のバウンディングボックスの変更比率
        const startW = parseFloat(e.target.getAttribute('data-last-width') || e.target.offsetWidth.toString());
        const ratio = width / startW;

        e.events.forEach((ev: any) => {
            const el = ev.target as HTMLElement;
            const ew = parseFloat(el.getAttribute('data-start-w') || el.offsetWidth.toString());
            const eh = parseFloat(el.getAttribute('data-start-h') || el.offsetHeight.toString());
            const elft = parseFloat(el.getAttribute('data-start-l') || el.offsetLeft.toString());
            const et = parseFloat(el.getAttribute('data-start-t') || el.offsetTop.toString());
            const efs = parseFloat(el.getAttribute('data-start-fs') || window.getComputedStyle(el).fontSize);

            el.style.width = `${ew * ratio}px`;
            el.style.height = `${eh * ratio}px`;
            el.style.left = `${elft * ratio}px`;
            el.style.top = `${et * ratio}px`;
            el.style.fontSize = `${efs * ratio}px`;

            // transformの位置調整（Moveableのグループドラッグ用）
            // 注意: グループリサイズ時は ev.drag.transform も適用される
            el.style.transform = ev.drag.transform;
        });
    };

    return (
        <>
            {/* ホバー用のオレンジ枠 */}
            {hoverTargets.length > 0 && (
                <Moveable
                    target={hoverTargets}
                    container={canvasRef.current || undefined}
                    draggable={false}
                    resizable={false}
                    origin={false}
                    zoom={1 / zoom}
                    className="moveable-group-hover"
                />
            )}

            {/* グループ選択用のオレンジ枠 */}
            {targets.length > 0 && (
                <Moveable
                    target={targets}
                    container={canvasRef.current || undefined}
                    draggable={selectionMode === 'group'}
                    resizable={true}
                    renderDirections={["nw", "ne", "sw", "se"]}
                    origin={false}
                    snappable={true}
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
                    className="moveable-group-selection"
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
                    onResizeGroupStart={e => {
                        e.events.forEach(ev => {
                            const el = ev.target as HTMLElement;
                            el.setAttribute('data-start-w', el.offsetWidth.toString());
                            el.setAttribute('data-start-h', el.offsetHeight.toString());
                            el.setAttribute('data-start-l', el.offsetLeft.toString());
                            el.setAttribute('data-start-t', el.offsetTop.toString());
                            el.setAttribute('data-start-fs', window.getComputedStyle(el).fontSize);
                            el.setAttribute('data-last-width', (e as any).width?.toString() || el.offsetWidth.toString());
                        });
                    }}
                    onResizeGroup={e => {
                        handleGroupResize(e);
                        // キャンバス拡張
                        let maxR = 0;
                        let maxB = 0;
                        e.events.forEach((ev: any) => {
                            const rect = ev.target.getBoundingClientRect();
                            const canvasRect = canvasRef.current?.getBoundingClientRect();
                            if (canvasRect) {
                                maxR = Math.max(maxR, (rect.right - canvasRect.left) / zoom);
                                maxB = Math.max(maxB, (rect.bottom - canvasRect.top) / zoom);
                            }
                        });
                        if (maxR > 0 || maxB > 0) expandCanvas(maxR, maxB);
                    }}
                    onResizeGroupEnd={updateContentFromDOM}
                    onDragGroupEnd={updateContentFromDOM}
                />
            )}

            {/* 個別選択用の水色枠 */}
            {selectionMode === 'individual' && activeSubTarget && (
                <Moveable
                    target={activeSubTarget}
                    container={canvasRef.current || undefined}
                    draggable={true}
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
                    keepRatio={moveableKeepRatio || activeSubTarget.tagName.toLowerCase() === 'img'}
                    throttleDrag={1}
                    throttleResize={1}
                    zoom={1 / zoom}
                    className="moveable-sub-selection"
                    onDrag={e => {
                        e.target.style.transform = e.transform;
                        const rect = e.target.getBoundingClientRect();
                        const canvasRect = canvasRef.current?.getBoundingClientRect();
                        if (canvasRect) {
                            expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                        }
                    }}
                    onResize={e => {
                        const target = e.target as HTMLElement;
                        let { width, height, drag } = e;
                        const isText = isTextBox(target);

                        target.style.width = `${width}px`;
                        target.style.height = isText ? 'auto' : `${height}px`;
                        target.style.transform = drag.transform;

                        if (isText) {
                            const startW = parseFloat(target.getAttribute('data-start-w') || '0');
                            if (startW > 0) {
                                const ratio = width / startW;
                                const startFs = parseFloat(target.getAttribute('data-start-fs') || window.getComputedStyle(target).fontSize);
                                target.style.fontSize = `${startFs * ratio}px`;
                            }
                            target.style.height = `${target.scrollHeight}px`;
                        }

                        const rect = target.getBoundingClientRect();
                        const canvasRect = canvasRef.current?.getBoundingClientRect();
                        if (canvasRect) {
                            expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                        }
                    }}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={updateContentFromDOM}
                    onDragEnd={updateContentFromDOM}
                />
            )}
        </>
    );
};

export default MoveableManager;
