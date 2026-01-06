import { useEffect } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { elementService } from '@/services/elementService';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * ショートカットキー（Ctrl+S, Ctrl+O, Delete等）を管理するフック
 */
export const useHotkeys = (canvasRef: React.RefObject<HTMLDivElement | null>) => {
    const { handleOpen, handleOverwrite } = useFileSystem();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Ctrl + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();

                const activeElement = document.activeElement as HTMLElement;
                // デザイン領域内の要素が編集中の場合のみ blur を実行
                if (activeElement && activeElement.contentEditable === 'true' && canvasRef.current?.contains(activeElement)) {
                    activeElement.blur();
                    await new Promise(resolve => requestAnimationFrame(resolve));
                }
                await handleOverwrite();
            }

            // Ctrl + O: 開く
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                handleOpen();
            }

            // Delete / Backspace: 削除 (入力中でない場合のみ)
            if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                const activeElement = document.activeElement as HTMLElement;
                if (activeElement.contentEditable === 'true') return; // テキスト編集中はデフォルト動作

                const state = useEditorStore.getState();
                const selectedIds = state.selectedIds;

                if (selectedIds.length > 0 && canvasRef.current) {
                    e.preventDefault();
                    const surface = canvasRef.current.querySelector('.DesignSurface');
                    if (!surface) return;

                    const targets = selectedIds
                        .map(id => surface.querySelector(`[id="${id}"]`))
                        .filter((el): el is HTMLElement => el !== null);

                    if (targets.length > 0) {
                        elementService.deleteElements(targets);
                        state.triggerDeselect(); // 選択解除を通知
                        // この後、useMoveable 側の updateContentFromDOM が呼ばれる必要があるが、
                        // ここでは直接ストアに同期するため、一度明示的に content を更新する
                        // (実際には elementService の後に setContent を呼ぶのが理想)
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOverwrite, handleOpen, canvasRef]);
};
