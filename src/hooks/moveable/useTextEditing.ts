import { useState, useCallback, useRef } from 'react';
import type { RefObject, MouseEvent } from 'react';
import { htmlService } from '@/services/htmlService';

const keyDownListeners = new WeakMap<HTMLElement, (e: KeyboardEvent) => void>();

export const useTextEditing = (
    canvasRef: RefObject<HTMLDivElement | null>,
    isLocked: boolean,
    setContent: (content: string) => void,
    isTextBox: (el: HTMLElement) => boolean,
    imageUrls: Record<string, string>
) => {
    const editingElementRef = useRef<HTMLElement | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const isEditingRef = useRef<boolean>(false);

    const updateContentFromDOM = useCallback(() => {
        const surface = canvasRef.current?.querySelector('.DesignSurface') as HTMLElement;
        if (surface) {
            const cleanHtml = htmlService.getCleanHTML(surface, imageUrls);
            setContent(cleanHtml);
        }
    }, [canvasRef, setContent, imageUrls]);

    const finishEditing = useCallback(() => {
        if (editingElementRef.current && isEditingRef.current) {
            const target = editingElementRef.current;
            const onKeyDown = keyDownListeners.get(target);
            if (onKeyDown) {
                target.removeEventListener('keydown', onKeyDown);
                keyDownListeners.delete(target);
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

        // テキストボックスでない場合は編集を開始しない
        if (!isTextBox(target)) return;

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
                htmlService.insertLineBreak();
            }
        };
        target.addEventListener('keydown', onKeyDown);
        keyDownListeners.set(target, onKeyDown);

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
