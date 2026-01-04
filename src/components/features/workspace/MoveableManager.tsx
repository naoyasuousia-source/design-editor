import React, { useMemo, useState, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
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

const calculateGroupBounds = (elements: HTMLElement[], container: HTMLElement | null, zoom: number) => {
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
    // コンテナ自体が scale(zoom) されているので、CSS の left/top に指定する値は unscaled である必要がある
    return {
        left: minX / zoom,
        top: minY / zoom,
        width: (maxX - minX) / zoom,
        height: (maxY - minY) / zoom
    };
};

const MoveableManager: React.FC<MoveableManagerProps> = (props) => {
    const { targets, canvasRef, selectionMode, activeSubTarget, hoverTargets, zoom } = props;
    const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);

    const onOverlayRef = useCallback((el: HTMLDivElement | null) => {
        setOverlayEl(el);
    }, []);

    // 境界計算をメモ化
    const hoverBounds = useMemo(() => calculateGroupBounds(hoverTargets, canvasRef.current, zoom), [hoverTargets, canvasRef, zoom]);
    const groupBounds = useMemo(() => calculateGroupBounds(targets, canvasRef.current, zoom), [targets, canvasRef, zoom]);

    const hasGroupId = targets.length > 0 && targets[0]?.getAttribute('data-group-id');
    const isGroupActive = (selectionMode === 'group' || selectionMode === 'individual') && hasGroupId;

    const selectionKey = useMemo(() => {
        return `${selectionMode}-${targets.map(t => t.id || t.className).join(',')}-${groupBounds?.width}-${groupBounds?.height}`;
    }, [selectionMode, targets, groupBounds]);

    const updateOverlayBounds = useCallback(() => {
        // 現在は JSX ベースでレンダリングしているため、この関数は Moveable 側のリクエストに応えるための空実装、
        // あるいは必要に応じて forceUpdate を呼ぶためのものになります。
    }, []);

    return (
        <>
            {/* ホバーオーバーレイ */}
            {hoverTargets.length > 0 && hoverBounds && (
                <div
                    className="absolute pointer-events-none border-2 border-orange-500 z-[9998] hover-selection-overlay"
                    style={{
                        left: hoverBounds.left,
                        top: hoverBounds.top,
                        width: hoverBounds.width,
                        height: hoverBounds.height,
                    }}
                />
            )}

            {/* グループ選択オーバーレイ */}
            {isGroupActive && groupBounds && (
                <div
                    ref={onOverlayRef}
                    className={cn(
                        "absolute z-[9999] group-selection-overlay",
                        // グループ選択モードの時は Moveable が線を引くので border-0、
                        // 個別選択モードの時は Moveable が引かないので border-2 を出す
                        selectionMode === 'individual' ? "border-2 border-orange-500" : "border-0",
                        selectionMode !== 'group' && "pointer-events-none"
                    )}
                    style={{
                        left: groupBounds.left,
                        top: groupBounds.top,
                        width: groupBounds.width,
                        height: groupBounds.height,
                    }}
                />
            )}

            {/* GroupMoveable: 文字通り「オーバーレイ」をターゲットにする */}
            {isGroupActive && overlayEl && (
                <GroupMoveable
                    {...props}
                    groupOverlay={overlayEl}
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
