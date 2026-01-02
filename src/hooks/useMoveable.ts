import { useState, useCallback, useEffect, useRef } from 'react';
import type { RefObject, MouseEvent } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * デザイン領域内の要素を GUI 操作（Moveable）するためのフック
 * 
 * 動作:
 * - シングルクリック → 要素を選択（Moveable の拡大縮小ポイント表示）
 * - ダブルクリック → テキスト編集モード（contentEditable を有効化）
 * - 外側クリック → 編集確定、選択解除
 */
export const useMoveable = (canvasRef: RefObject<HTMLDivElement | null>) => {
    const [targets, setTargets] = useState<HTMLElement[]>([]);
    const [keepRatio, setKeepRatio] = useState(false);
    const { setContent, isLocked, zoom } = useEditorStore();
    const editingElementRef = useRef<HTMLElement | null>(null);
    const isEditingRef = useRef<boolean>(false);

    /**
     * 要素がテキストボックスかどうかを判定する
     * (子要素を持たない、または画像でない要素)
     */
    const isTextBox = useCallback((el: HTMLElement) => {
        if (el.tagName.toLowerCase() === 'img') return false;
        // デザイン上のテキスト要素は概ね子要素を持たない div
        return el.children.length === 0;
    }, []);

    /**
     * 現在のターゲットに基づいたリサイズハンドルの方向を返す
     */
    const getRenderDirections = useCallback(() => {
        if (targets.length === 0) return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];
        const first = targets[0];
        if (isTextBox(first)) {
            // テキストボックスは四隅と左右のみ
            return ["nw", "ne", "sw", "se", "w", "e"];
        }
        return ["nw", "ne", "sw", "se", "w", "e", "n", "s"];
    }, [targets, isTextBox]);

    // 編集内容をストアに保存
    const updateContentFromDOM = useCallback(() => {
        const surface = canvasRef.current?.querySelector('.DesignSurface');
        if (surface) {
            // contentEditable 属性を削除してからHTML を取得
            const clone = surface.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
            });
            setContent(clone.innerHTML);
        }
    }, [canvasRef, setContent]);

    // 編集モードを終了する
    const finishEditing = useCallback(() => {
        if (editingElementRef.current && isEditingRef.current) {
            editingElementRef.current.contentEditable = 'false';
            editingElementRef.current.blur();
            updateContentFromDOM();
            editingElementRef.current = null;
            isEditingRef.current = false;
            console.log('finishEditing: 編集を確定しました');
        }
    }, [updateContentFromDOM]);

    // リサイズ開始時の挙動制御
    const handleResizeStart = useCallback((e: any) => {
        // e.direction [h, v] : 0 以外が2つあれば角
        const [h, v] = e.direction;
        const isCorner = h !== 0 && v !== 0;
        setKeepRatio(isCorner);

        // 元のサイズを記録
        e.target.setAttribute('data-last-width', e.target.offsetWidth.toString());
        e.target.setAttribute('data-last-height', e.target.offsetHeight.toString());
    }, []);

    // 親要素の範囲内でのみ移動・リサイズを許可
    const getBounds = useCallback(() => {
        if (targets.length === 0) return undefined;
        const first = targets[0];
        const parent = first.parentElement;
        if (!parent) return undefined;

        // デザイン領域全体か、特定の親要素か
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        if (!canvasRect) return undefined;

        return {
            left: (parentRect.left - canvasRect.left) / zoom,
            top: (parentRect.top - canvasRect.top) / zoom,
            right: (parentRect.right - canvasRect.left) / zoom,
            bottom: (parentRect.bottom - canvasRect.top) / zoom,
        };
    }, [targets, canvasRef]);

    // 要素のダブルクリック（テキスト編集）
    const handleDoubleClick = useCallback((e: MouseEvent) => {
        console.log('handleDoubleClick: 開始');
        e.stopPropagation(); // バブルアップを防ぐ

        if (isLocked) {
            console.log('handleDoubleClick: isLocked でスキップ');
            return;
        }

        const target = e.target as HTMLElement;
        console.log('handleDoubleClick: target =', target.tagName, target.id, target.className);

        // DesignSurface 自体はテキスト編集対象外
        if (target.classList.contains('DesignSurface')) {
            console.log('handleDoubleClick: DesignSurface 自体なのでスキップ');
            return;
        }

        // すでに編集中なら何もしない
        if (isEditingRef.current && editingElementRef.current === target) {
            console.log('handleDoubleClick: すでに編集中');
            return;
        }

        // 前の編集を確定
        finishEditing();

        // デザイン要素（DesignSurface の子孫）かどうか確認
        const surface = target.closest('.DesignSurface');
        if (!surface) {
            console.log('handleDoubleClick: DesignSurface の子孫ではない');
            return;
        }

        console.log('handleDoubleClick: テキスト編集モードに入ります');

        // テキスト編集モードに入る
        // 注意: Workspace.tsx で DesignContent を memo 化しているため、
        // targets の更新による再描画で contentEditable がリセットされるのを防げる
        setTargets([]); // Moveable を隠す
        target.contentEditable = 'true';
        editingElementRef.current = target;
        isEditingRef.current = true;

        // 次のフレームでフォーカスとカーソル位置を設定（再描画との競合回避）
        requestAnimationFrame(() => {
            target.focus();

            // クリック位置にカーソルを配置
            try {
                const selection = window.getSelection();
                if (selection) {
                    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    if (range) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                        console.log('handleDoubleClick: カーソル位置設定完了');
                    }
                }
            } catch (err) {
                console.error('handleDoubleClick: カーソル位置設定エラー', err);
            }
            console.log('handleDoubleClick: 完了', { contentEditable: target.contentEditable });
        });
    }, [isLocked, finishEditing]);

    // クリックによる要素選択
    const handleCanvasClick = useCallback((e: MouseEvent) => {
        if (isLocked) return;

        const target = e.target as HTMLElement;
        const isShift = e.shiftKey;

        console.log('handleCanvasClick:', target.tagName, target.className, 'detail:', e.detail);

        // ダブルクリック検知 (e.detail === 2)
        // React の onDoubleClick が Moveable の干渉で発火しにくい場合があるため、
        // mousedown 時の detail で判定するのが最も確実
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
            // 外側をクリックした場合、編集を確定
            finishEditing();
        }

        // キャンバス自体（DesignSurface）のクリックなら選択解除
        if (target.classList.contains('DesignSurface')) {
            if (!isShift) setTargets([]);
            return;
        }

        // DesignSurface 内の要素を探す（クリックした要素自体を選択対象とする）
        let el: HTMLElement | null = target;
        const surface = el.closest('.DesignSurface');
        if (!surface || el === surface) {
            return;
        }

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
    }, [isLocked, canvasRef, finishEditing, handleDoubleClick]);

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
    }, [finishEditing]);

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
    };
};
