import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useSelection } from '@/hooks/moveable/useSelection';
import { useTextEditing } from '@/hooks/moveable/useTextEditing';
import { useTransform } from '@/hooks/moveable/useTransform';
import { useMoveableHandlers } from '@/hooks/moveable/useMoveableHandlers';

/**
 * デザイン領域内の要素を GUI 操作（Moveable）するためのフック
 */
export const useMoveable = (canvasRef: RefObject<HTMLDivElement | null>) => {
    const {
        content, setContent, isLocked, zoom, autoSelectId, setAutoSelectId
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
    } = useTextEditing(canvasRef, isLocked, setContent, isTextBox);

    const {
        keepRatio,
        handleResizeStart,
        getBounds
    } = useTransform(canvasRef, targets, zoom, isTextBox);

    const {
        handleCanvasClick,
        handleMouseUp,
        handleMouseMove,
        handleMouseLeave
    } = useMoveableHandlers({
        canvasRef,
        isLocked,
        isEditing,
        isEditingRef,
        editingElementRef,
        targets,
        selectionMode,
        setTargets,
        setSelectionMode,
        setActiveSubTarget,
        setHoverTargets,
        finishEditing,
        handleDoubleClick,
        selectNone
    });

    // キーボードショートカット（Esc で選択解除・編集終了）
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                finishEditing();
                selectNone();
            }
        };
        const handleCanvasUpdate = () => {
            updateContentFromDOM();
        };
        window.addEventListener('keydown', handleKeys);
        window.addEventListener('canvas-update', handleCanvasUpdate);
        return () => {
            window.removeEventListener('keydown', handleKeys);
            window.removeEventListener('canvas-update', handleCanvasUpdate);
        };
    }, [finishEditing, selectNone, updateContentFromDOM]);

    // 挿入された要素を自動選択する
    useEffect(() => {
        if (!autoSelectId) return;

        // DOMの反映（updateContentFromDOM経由の再レンダリング）を待機
        const timeout = setTimeout(() => {
            const el = canvasRef.current?.querySelector(`[id="${autoSelectId}"]`) as HTMLElement;
            if (el) {
                const gid = el.getAttribute('data-group-id');
                if (gid) {
                    const groupElements = Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${gid}"]`) || []) as HTMLElement[];
                    setTargets(groupElements);
                    setSelectionMode('group');
                    setActiveSubTarget(null);
                } else {
                    setTargets([el]);
                    setSelectionMode('individual');
                    setActiveSubTarget(el);
                }
                setAutoSelectId(null);
            }
        }, 300); // 余裕を持って300ms待機

        return () => clearTimeout(timeout);
    }, [autoSelectId, canvasRef, setTargets, setSelectionMode, setActiveSubTarget, setAutoSelectId]);

    return {
        targets: isLocked || useEditorStore.getState().isImageCropMode ? [] : targets,
        setTargets,
        selectionMode,
        activeSubTarget,
        selectNone,
        keepRatio,
        handleResizeStart,
        getBounds,
        getDirections: getRenderDirections,
        handleCanvasClick,
        handleMouseUp,
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
