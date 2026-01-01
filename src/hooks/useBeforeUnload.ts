import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * 編集中の内容がある場合にブラウザの終了・リロードを警告するフック
 */
export const useBeforeUnload = () => {
    const isDirty = useEditorStore((state) => state.isDirty);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                // モダンブラウザではメッセージは無視されるが、フラグを立てる必要がある
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
};
