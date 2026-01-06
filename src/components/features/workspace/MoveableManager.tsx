import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import { calculateGroupBounds } from '@/utils/bounds';

const GroupMoveable = React.lazy(() => import('@/components/features/workspace/GroupMoveable'));
const IndividualMoveable = React.lazy(() => import('@/components/features/workspace/IndividualMoveable'));

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

const MoveableManager: React.FC<MoveableManagerProps> = (props) => {
    const { targets, canvasRef, selectionMode, activeSubTarget, hoverTargets, zoom } = props;
    const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
    const [tick, setTick] = useState(0);

    const onOverlayRef = useCallback((el: HTMLDivElement | null) => {
        setOverlayEl(el);
    }, []);

    const updateOverlayBounds = useCallback(() => {
        setTick(t => t + 1);
    }, []);

    // 境界計算をメモ化
    const hoverBounds = useMemo(() => {
        if (hoverTargets.length === 0 || !canvasRef.current) return null;
        const rects = hoverTargets.map(el => el.getBoundingClientRect());
        const containerRect = canvasRef.current.getBoundingClientRect();
        return calculateGroupBounds(rects, containerRect, zoom);
    }, [hoverTargets, canvasRef, zoom]);

    const groupBounds = useMemo(() => {
        if (targets.length === 0 || !canvasRef.current) return null;
        const rects = targets.map(el => el.getBoundingClientRect());
        const containerRect = canvasRef.current.getBoundingClientRect();
        return calculateGroupBounds(rects, containerRect, zoom);
    }, [targets, canvasRef, zoom, tick]);

    const hasGroupId = targets.length > 0 && targets[0]?.getAttribute('data-group-id');
    const isGroupActive = (selectionMode === 'group' || selectionMode === 'individual') && hasGroupId;

    const selectionKey = useMemo(() => {
        return `${selectionMode}-${targets.map(t => (t.id || 'no-id')).join('-')}`;
    }, [selectionMode, targets]);

    // 複数選択時（canGroup状態）に、選択された要素内の既存グループを抽出
    const existingGroupBoundsMap = useMemo(() => {
        const gid = targets[0]?.getAttribute('data-group-id');
        const isAllSameGroup = targets.length > 1 && gid !== null && targets.every(el => el.getAttribute('data-group-id') === gid);
        const canGroup = targets.length > 1 && !isAllSameGroup;

        if (!canGroup) return [];

        // 選択要素を持つグループIDごとにグループ化
        const groupMap = new Map<string, HTMLElement[]>();
        targets.forEach(el => {
            const groupId = el.getAttribute('data-group-id');
            if (groupId) {
                if (!groupMap.has(groupId)) {
                    groupMap.set(groupId, []);
                }
                groupMap.get(groupId)!.push(el);
            }
        });

        // 各グループのバウンディングボックスを計算
        const result: { groupId: string; bounds: { left: number; top: number; width: number; height: number } }[] = [];
        groupMap.forEach((_elements, groupId) => {
            if (!canvasRef.current) return;
            const allGroupElements = Array.from(canvasRef.current.querySelectorAll(`[data-group-id="${groupId}"]`)) as HTMLElement[];
            if (allGroupElements.length === 0) return;

            const rects = allGroupElements.map(el => el.getBoundingClientRect());
            const containerRect = canvasRef.current.getBoundingClientRect();
            const bounds = calculateGroupBounds(rects, containerRect, zoom);
            if (bounds) {
                result.push({ groupId, bounds });
            }
        });
        return result;
    }, [targets, canvasRef, zoom]);

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

            {/* 複数選択時: 既存グループのオレンジ枠を常時表示 */}
            {existingGroupBoundsMap.map(({ groupId, bounds }) => (
                <div
                    key={`existing-group-${groupId}`}
                    className="absolute pointer-events-none border-2 border-orange-500 z-[9997] existing-group-overlay"
                    style={{
                        left: bounds.left,
                        top: bounds.top,
                        width: bounds.width,
                        height: bounds.height,
                    }}
                />
            ))}

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
                <React.Suspense fallback={null}>
                    <GroupMoveable
                        {...props}
                        groupOverlay={overlayEl}
                        selectionKey={selectionKey}
                        updateOverlayBounds={updateOverlayBounds}
                        tick={tick}
                    />
                </React.Suspense>
            )}

            {selectionMode === 'individual' && activeSubTarget && (
                <React.Suspense fallback={null}>
                    <IndividualMoveable
                        {...props}
                        target={activeSubTarget}
                        updateOverlayBounds={updateOverlayBounds}
                    />
                </React.Suspense>
            )}
        </>
    );
};

export default MoveableManager;
