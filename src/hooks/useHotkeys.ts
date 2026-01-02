import { useEffect } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';

/**
 * ショートカットキー（Ctrl+S, Ctrl+O等）を管理するフック
 */
export const useHotkeys = () => {
    const { handleOpen, handleOverwrite } = useFileSystem();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Ctrl + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();

                // 編集中の要素がある場合、blur を発生させてテキスト編集を確定
                const activeElement = document.activeElement as HTMLElement;

                if (activeElement && activeElement.contentEditable === 'true') {
                    activeElement.blur();
                    // blur イベントハンドラが updateContentFromDOM を呼ぶのを待つ
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    await handleOverwrite();
                } else {
                    await handleOverwrite();
                }
            }

            // Ctrl + O: 開く
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                handleOpen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleOverwrite, handleOpen]);
};
