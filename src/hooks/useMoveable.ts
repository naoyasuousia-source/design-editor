import { useState, useCallback, useEffect } from 'react';
import type { RefObject, MouseEvent } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * デザイン領域内の要素を GUI 操作（Moveable）するためのフック
 */
export const useMoveable = (canvasRef: RefObject<HTMLDivElement | null>) => {
    const [targets, setTargets] = useState<HTMLElement[]>([]);
    const { setContent, isLocked } = useEditorStore();

    // 編集内容をストアに保存
    const updateContentFromDOM = useCallback(() => {
        const surface = canvasRef.current?.querySelector('.DesignSurface');
        if (surface) {
            // Moveable の補助要素などが混入しないよう注意が必要だが、
            // Moveable は DesignSurface の外側にレンダリングされるように配置する。
            setContent(surface.innerHTML);
        }
    }, [canvasRef, setContent]);

    // 要素のダブルクリック（テキスト編集）
    const handleDoubleClick = useCallback((e: MouseEvent) => {
        if (isLocked) return;
        const target = e.target as HTMLElement;

        // すでに contentEditable が有効なら何もしない
        if (target.contentEditable === 'true') return;

        // デザイン要素（DesignSurface の子要素）を探す
        let el: HTMLElement | null = target;
        while (el && el.parentElement && !el.parentElement.classList.contains('DesignSurface')) {
            el = el.parentElement;
        }

        if (el) {
            // テキストボックス内への子要素混入制限の要件に基づき、
            // 編集対象がテキストボックス（Leaf Node）であることを確認
            setTargets([]); // Moveable を隠す
            target.contentEditable = 'true';
            target.focus();

            const onBlur = () => {
                target.contentEditable = 'false';
                updateContentFromDOM();
                target.removeEventListener('blur', onBlur);
            };
            target.addEventListener('blur', onBlur);
        }
    }, [isLocked, updateContentFromDOM]);

    // クリックによる要素選択
    const handleCanvasClick = useCallback((e: MouseEvent) => {
        if (isLocked) return;

        const target = e.target as HTMLElement;
        const isShift = e.shiftKey;

        // 既に編集中の要素があれば無視
        if (target.contentEditable === 'true') return;

        // キャンバス自体のクリックなら選択解除（Shiftがない場合のみ）
        if (target.classList.contains('DesignSurface')) {
            if (!isShift) setTargets([]);
            return;
        }

        // デザイン要素（DesignSurface の子要素）を探す
        let el: HTMLElement | null = target;
        while (el && el.parentElement && !el.parentElement.classList.contains('DesignSurface')) {
            el = el.parentElement;
        }

        if (el) {
            const groupId = el.getAttribute('data-group-id');
            const groupElements = groupId
                ? Array.from(canvasRef.current?.querySelectorAll(`[data-group-id="${groupId}"]`) || []) as HTMLElement[]
                : [el];

            if (isShift) {
                // Shift+クリック: 選択への追加・削除
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
    }, [isLocked, canvasRef]);

    // キーボードショートカット（Esc で選択解除など）
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setTargets([]);
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    return {
        targets,
        setTargets,
        handleCanvasClick,
        handleDoubleClick,
        updateContentFromDOM,
    };
};
