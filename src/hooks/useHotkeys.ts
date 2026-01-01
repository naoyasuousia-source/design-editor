import { useEffect } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';

/**
 * ショートカットキー（Ctrl+S, Ctrl+O等）を管理するフック
 */
export const useHotkeys = () => {
    const { handleOpen, handleOverwrite } = useFileSystem();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + S: 保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleOverwrite();
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
