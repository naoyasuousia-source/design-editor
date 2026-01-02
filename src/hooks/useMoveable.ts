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
        content, setContent, isLocked, zoom, isResponsiveResize
    } = useEditorStore();

    const {
        targets,
        setTargets,
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
    } = useTransform(canvasRef, targets, zoom, isResponsiveResize, isTextBox);

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
            if (!isShift) setTargets([]);
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
                setTargets(prev => {
                    const alreadySelected = groupElements.every(item => prev.includes(item));
                    if (alreadySelected) {
                        return prev.filter(item => !groupElements.includes(item));
                    } else {
                        return [...prev, ...groupElements];
                    }
                });
            } else {
                setTargets(groupElements);
            }
        }
    }, [isLocked, canvasRef, finishEditing, handleDoubleClick, setTargets]);

    // キーボードショートカット（Esc で選択解除・編集終了）
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                finishEditing();
                setTargets([]);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [finishEditing, setTargets]);

    return {
        targets,
        setTargets,
        keepRatio,
        handleResizeStart,
        getBounds,
        handleCanvasClick,
        handleDoubleClick,
        updateContentFromDOM,
        finishEditing,
        isTextBox,
        getRenderDirections,
        isEditing,
    };
};
