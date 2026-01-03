import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

// グループ要素のバウンディングボックスを計算
const calculateGroupBounds = (elements: HTMLElement[], container: HTMLElement | null) => {
    if (elements.length === 0 || !container) return null;

    const containerRect = container.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        minX = Math.min(minX, rect.left - containerRect.left);
        minY = Math.min(minY, rect.top - containerRect.top);
        maxX = Math.max(maxX, rect.right - containerRect.left);
        maxY = Math.max(maxY, rect.bottom - containerRect.top);
    });

    return {
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

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
    // オーバーレイ要素をuseStateで管理し、作成時に再レンダリングをトリガー
    const [hoverOverlay, setHoverOverlay] = useState<HTMLDivElement | null>(null);
    const [groupOverlay, setGroupOverlay] = useState<HTMLDivElement | null>(null);

    // 初期マウント時に強制再レンダリング用
    const [, forceUpdate] = useState({});

    // ホバー用オーバーレイを作成・更新
    useEffect(() => {
        if (!canvasRef.current) return;

        let overlay = hoverOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'group-hover-overlay';
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.border = '2px solid #f97316';
            overlay.style.opacity = '0.6';
            overlay.style.display = 'none';
            overlay.style.zIndex = '9998';
            canvasRef.current.appendChild(overlay);
            setHoverOverlay(overlay);
        }

        if (hoverTargets.length > 0) {
            const bounds = calculateGroupBounds(hoverTargets, canvasRef.current);
            if (bounds) {
                overlay.style.display = 'block';
                overlay.style.left = `${bounds.left}px`;
                overlay.style.top = `${bounds.top}px`;
                overlay.style.width = `${bounds.width}px`;
                overlay.style.height = `${bounds.height}px`;
            }
        } else {
            overlay.style.display = 'none';
        }
    }, [hoverTargets, canvasRef, hoverOverlay]);

    // グループ選択用オーバーレイを作成・更新
    useEffect(() => {
        if (!canvasRef.current) return;

        let overlay = groupOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'group-selection-overlay';
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.display = 'none';
            overlay.style.zIndex = '9999';
            canvasRef.current.appendChild(overlay);
            setGroupOverlay(overlay);
            // 状態が更新されたので再レンダリングがトリガーされる
        }

        // グループ選択または個別選択モードで、グループ要素がある場合
        const hasGroup = targets.length > 0 && targets[0]?.getAttribute('data-group-id');
        if ((selectionMode === 'group' || selectionMode === 'individual') && hasGroup) {
            const bounds = calculateGroupBounds(targets, canvasRef.current);
            if (bounds) {
                overlay.style.display = 'block';
                overlay.style.left = `${bounds.left}px`;
                overlay.style.top = `${bounds.top}px`;
                overlay.style.width = `${bounds.width}px`;
                overlay.style.height = `${bounds.height}px`;
            }
        } else {
            overlay.style.display = 'none';
        }

        // Moveableが正しくターゲットを認識できるように強制更新
        forceUpdate({});
    }, [targets, selectionMode, canvasRef, groupOverlay]);

    // クリーンアップ
    useEffect(() => {
        return () => {
            hoverOverlay?.remove();
            groupOverlay?.remove();
        };
    }, [hoverOverlay, groupOverlay]);

    // グループ要素かどうかを判定
    const hasGroupId = useMemo(() => {
        return targets.length > 0 && targets[0]?.getAttribute('data-group-id');
    }, [targets]);

    // オーバーレイの位置を更新するヘルパー
    const updateOverlayBounds = useCallback(() => {
        if (!groupOverlay || !hasGroupId || !canvasRef.current) return;
        const bounds = calculateGroupBounds(targets, canvasRef.current);
        if (bounds) {
            groupOverlay.style.left = `${bounds.left}px`;
            groupOverlay.style.top = `${bounds.top}px`;
            groupOverlay.style.width = `${bounds.width}px`;
            groupOverlay.style.height = `${bounds.height}px`;
        }
    }, [groupOverlay, hasGroupId, targets, canvasRef]);

    // オーバーレイが存在し、表示されているかどうか
    const showGroupMoveable = groupOverlay &&
        hasGroupId &&
        (selectionMode === 'group' || selectionMode === 'individual') &&
        groupOverlay.style.display !== 'none';

    return (
        <>
            {/* グループ選択用のオレンジ枠（オーバーレイ要素を対象） */}
            {showGroupMoveable && (
                <Moveable
                    target={groupOverlay}
                    container={canvasRef.current || undefined}
                    draggable={selectionMode === 'group'}
                    resizable={selectionMode === 'group'}
                    renderDirections={["nw", "ne", "sw", "se"]}
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
                    className="moveable-group-selection"
                    onDrag={e => {
                        // オーバーレイを移動
                        e.target.style.transform = e.transform;

                        // グループ内の全要素も同時に移動
                        const deltaX = e.delta[0];
                        const deltaY = e.delta[1];
                        targets.forEach(el => {
                            const currentLeft = parseFloat(el.style.left) || el.offsetLeft;
                            const currentTop = parseFloat(el.style.top) || el.offsetTop;
                            el.style.left = `${currentLeft + deltaX}px`;
                            el.style.top = `${currentTop + deltaY}px`;
                        });

                        // キャンバス拡張チェック
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
                        // transformをリセットして位置を確定
                        if (groupOverlay) {
                            groupOverlay.style.transform = '';
                            updateOverlayBounds();
                        }
                        updateContentFromDOM();
                    }}
                    onResizeStart={e => {
                        // グループ内全要素の初期値を保存
                        targets.forEach(el => {
                            el.setAttribute('data-start-w', el.offsetWidth.toString());
                            el.setAttribute('data-start-h', el.offsetHeight.toString());
                            el.setAttribute('data-start-l', (parseFloat(el.style.left) || el.offsetLeft).toString());
                            el.setAttribute('data-start-t', (parseFloat(el.style.top) || el.offsetTop).toString());
                            el.setAttribute('data-start-fs', window.getComputedStyle(el).fontSize);
                        });
                        // オーバーレイの初期位置・サイズを保存
                        const overlayEl = e.target as HTMLElement;
                        overlayEl.setAttribute('data-start-w', overlayEl.offsetWidth.toString());
                        overlayEl.setAttribute('data-start-h', overlayEl.offsetHeight.toString());
                        overlayEl.setAttribute('data-start-l', overlayEl.style.left);
                        overlayEl.setAttribute('data-start-t', overlayEl.style.top);
                    }}
                    onResize={e => {
                        const overlayTarget = e.target as HTMLElement;
                        const { width, height, drag } = e;

                        // オーバーレイのサイズ更新
                        overlayTarget.style.width = `${width}px`;
                        overlayTarget.style.height = `${height}px`;
                        overlayTarget.style.transform = drag.transform;

                        // 比率を計算
                        const startW = parseFloat(overlayTarget.getAttribute('data-start-w') || '1');
                        const ratio = width / startW;

                        // リサイズ開始時のオーバーレイ位置
                        const overlayStartL = parseFloat(overlayTarget.getAttribute('data-start-l') || '0');
                        const overlayStartT = parseFloat(overlayTarget.getAttribute('data-start-t') || '0');

                        targets.forEach(el => {
                            const ew = parseFloat(el.getAttribute('data-start-w') || '0');
                            const eh = parseFloat(el.getAttribute('data-start-h') || '0');
                            const elft = parseFloat(el.getAttribute('data-start-l') || '0');
                            const et = parseFloat(el.getAttribute('data-start-t') || '0');
                            const efs = parseFloat(el.getAttribute('data-start-fs') || '16');

                            // オーバーレイ左上からの相対位置を維持しながらリサイズ
                            const relativeL = elft - overlayStartL;
                            const relativeT = et - overlayStartT;

                            el.style.width = `${ew * ratio}px`;
                            el.style.height = `${eh * ratio}px`;
                            el.style.left = `${overlayStartL + relativeL * ratio}px`;
                            el.style.top = `${overlayStartT + relativeT * ratio}px`;
                            el.style.fontSize = `${efs * ratio}px`;
                        });

                        // キャンバス拡張チェック
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
                        // transformをリセット
                        if (groupOverlay) {
                            groupOverlay.style.transform = '';
                            updateOverlayBounds();
                        }
                        updateContentFromDOM();
                    }}
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
                        // オーバーレイ位置も更新
                        updateOverlayBounds();
                    }}
                    onDragEnd={() => {
                        updateContentFromDOM();
                        updateOverlayBounds();
                    }}
                    onResize={e => {
                        const target = e.target as HTMLElement;
                        const { width, height, drag } = e;
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

                        // オーバーレイ位置も更新
                        updateOverlayBounds();
                    }}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={() => {
                        updateContentFromDOM();
                        updateOverlayBounds();
                    }}
                />
            )}
        </>
    );
};

export default MoveableManager;
