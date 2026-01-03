import { useCallback, useEffect } from 'react';
import type { RefObject, MouseEvent } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useSelection } from './moveable/useSelection';
import { useTextEditing } from './moveable/useTextEditing';
import { useTransform } from './moveable/useTransform';

/**
 * デザイン領域内の要素を GUI 操作（Moveable）するためのフック
 */
export const useMoveable = (canvasRef: RefObject<HTMLDivElement | null>) => {
    const {
        content, setContent, isLocked, zoom
    } = useEditorStore();

    const {
        targets,
        setTargets,
        selectNone,
        selectionMode,
        setSelectionMode,
        activeSubTarget,
        setActiveSubTarget,
        hoverTargets,
        setHoverTargets,
        isTextBox,
        getRenderDirections
    } = useSelection(canvasRef, content);

    const {
        isEditing,
        isEditingRef,
        editingElementRef,
        handleDoubleClick,
        finishEditing,
        updateContentFromDOM
    } = useTextEditing(canvasRef, isLocked, setContent);

    const {
        keepRatio,
        handleResizeStart,
        getBounds
    } = useTransform(canvasRef, targets, zoom, isTextBox);

    // クリックによる要素選択
    const handleCanvasClick = useCallback((e: MouseEvent) => {
        if (isLocked) return;

        const target = e.target as HTMLElement;
        const isShift = e.shiftKey;

        // ダブルクリック検知 (e.detail === 2)
        if (e.detail === 2) {
            e.stopPropagation();
            handleDoubleClick(e);
            return;
        }

        // 編集中の要素の内部をクリックした場合は何もしない（テキスト選択を許可）
        if (isEditingRef.current && editingElementRef.current) {
            if (editingElementRef.current.contains(target) || editingElementRef.current === target) {
                return;
            }
            finishEditing();
        }

        // キャンバス自体（DesignSurface）のクリックなら選択解除
        if (target.classList.contains('DesignSurface')) {
            if (!isShift) selectNone();
            return;
        }

        // DesignSurface 内の要素を探す
        let el: HTMLElement | null = target;
        const surface = el.closest('.DesignSurface');
        if (!surface || el === surface) return;

        if (el) {
            const groupId = el.getAttribute('data-group-id');
            const groupElements = groupId
                ? Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${groupId}"]`) || []) as HTMLElement[]
                : [el];

            if (isShift) {
                // シフト押下時は従来通り
                setTargets(prev => {
                    const alreadySelected = groupElements.every(item => prev.includes(item));
                    if (alreadySelected) {
                        return prev.filter(item => !groupElements.includes(item));
                    } else {
                        return [...prev, ...groupElements];
                    }
                });
                setSelectionMode('group');
            } else {
                // 通常クリック：2段階選択ロジック
                if (groupId) {
                    const isAlreadyGroupSelected = targets.length === groupElements.length &&
                        groupElements.every(e => targets.includes(e));

                    if (isAlreadyGroupSelected) {
                        // 2回目：個別選択モードへ
                        setSelectionMode('individual');
                        setActiveSubTarget(el);
                    } else {
                        // 1回目：グループ全体を選択
                        setTargets(groupElements);
                        setSelectionMode('group');
                        setActiveSubTarget(null);
                    }
                } else {
                    // グループなし要素、またはグループ解除後
                    setTargets([el]);
                    setSelectionMode('individual');
                    setActiveSubTarget(el);
                }
            }
        }
    }, [isLocked, canvasRef, finishEditing, handleDoubleClick, setTargets, targets, selectNone, setSelectionMode, setActiveSubTarget]);

    // ホバー時の処理（グループハイライト用）
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isLocked || isEditing) return;

        const target = e.target as HTMLElement;
        const surface = target.closest('.DesignSurface');
        if (!surface || target === surface) {
            setHoverTargets([]);
            return;
        }

        // 要素自体または祖先から data-group-id を探す
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
            // すでに選択中のグループなら、ホバー表示は不要（実線があるので）
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

    // キーボードショートカット（Esc で選択解除・編集終了）
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                finishEditing();
                selectNone();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [finishEditing, selectNone]);

    return {
        targets,
        setTargets,
        selectionMode,
        activeSubTarget,
        keepRatio,
        handleResizeStart,
        getBounds,
        getDirections: getRenderDirections,
        handleCanvasClick,
        handleMouseMove,
        handleMouseLeave,
        handleDoubleClick,
        updateContentFromDOM,
        finishEditing,
        isTextBox,
        getRenderDirections,
        isEditing,
        hoverTargets
    };
};
