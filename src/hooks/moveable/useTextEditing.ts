import { useState, useCallback, useRef } from 'react';
import type { RefObject, MouseEvent } from 'react';

export const useTextEditing = (
    canvasRef: RefObject<HTMLDivElement | null>,
    isLocked: boolean,
    setContent: (content: string) => void
) => {
    const editingElementRef = useRef<HTMLElement | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const isEditingRef = useRef<boolean>(false);

    const updateContentFromDOM = useCallback(() => {
        const surface = canvasRef.current?.querySelector('.DesignSurface');
        if (surface) {
            const clone = surface.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
            });
            // エディタ専用の選択中クラスを除去して保存する
            clone.querySelectorAll('.moveable-target-active').forEach(el => {
                el.classList.remove('moveable-target-active');
            });
            setContent(clone.innerHTML);
        }
    }, [canvasRef, setContent]);

    const finishEditing = useCallback(() => {
        if (editingElementRef.current && isEditingRef.current) {
            const target = editingElementRef.current;
            const onKeyDown = (target as any)._onKeyDown;
            if (onKeyDown) {
                target.removeEventListener('keydown', onKeyDown);
                delete (target as any)._onKeyDown;
            }

            target.contentEditable = 'false';
            target.blur();
            updateContentFromDOM();
            editingElementRef.current = null;
            setIsEditing(false);
            isEditingRef.current = false;
        }
    }, [updateContentFromDOM]);

    const handleDoubleClick = useCallback((e: MouseEvent) => {
        if (isLocked) return;

        const target = e.target as HTMLElement;
        if (target.classList.contains('DesignSurface')) return;

        if (isEditingRef.current && editingElementRef.current === target) return;

        finishEditing();

        const surface = target.closest('.DesignSurface');
        if (!surface) return;

        target.contentEditable = 'true';
        editingElementRef.current = target;
        setIsEditing(true);
        isEditingRef.current = true;

        // Enterキーで改行（<br>）を実現し、新規要素作成を防ぐ
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                document.execCommand('insertLineBreak');
            }
        };
        target.addEventListener('keydown', onKeyDown);
        (target as any)._onKeyDown = onKeyDown; // クリーンアップ用

        requestAnimationFrame(() => {
            target.focus();
            try {
                const selection = window.getSelection();
                if (selection) {
                    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    if (range) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            } catch (err) {
                console.error('handleDoubleClick: Cursor positioning error', err);
            }
        });
    }, [isLocked, finishEditing]);

    return {
        isEditing,
        isEditingRef,
        editingElementRef,
        handleDoubleClick,
        finishEditing,
        updateContentFromDOM
    };
};
