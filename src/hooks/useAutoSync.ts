import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';

/**
 * 外部（AIなど）によるファイル変更を検知し、エディタに通知するフック
 */
export const useAutoSync = () => {
    const { folderHandle, fileName, detectExternalUpdate } = useEditorStore();

    useEffect(() => {
        // Vite の HMR (Hot Module Replacement) インスタンス経由来のカスタムイベントを購読
        // @ts-ignore
        if (import.meta.hot) {
            // @ts-ignore
            import.meta.hot.on('design-update', async (data: { fileName: string }) => {
                const { folderHandle, fileName, lastSaveTime } = useEditorStore.getState();

                // 自己保存直後の場合は無視する（1秒以内の更新検知）
                if (Date.now() - lastSaveTime < 1000) {
                    console.log('Ignoring self-save update signal');
                    return;
                }

                if (folderHandle && fileName === data.fileName) {
                    console.log(`External update detected for: ${data.fileName}`);

                    try {
                        // 1. まず現在のキャンバスをスクショ
                        const canvasElement = document.querySelector('.DesignSurface') as HTMLElement;
                        let snapshot = null;
                        if (canvasElement) {
                            const { captureCanvas } = await import('@/utils/screenshot');
                            snapshot = await captureCanvas(canvasElement);
                        }

                        // 2. 新しい内容を読み込む
                        const newContent = await fileSystemService.readFile(folderHandle, data.fileName);

                        // 3. ストアに通知（ここでロック & 一時バー表示）
                        detectExternalUpdate(newContent, snapshot);

                        console.log('Update detected and snapshot taken. Approval flow started.');
                    } catch (err) {
                        console.error('AutoSync failed to process update:', err);
                    }
                }
            });
        }
    }, [folderHandle, fileName, detectExternalUpdate]);
};
