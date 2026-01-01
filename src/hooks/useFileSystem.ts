import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';
import { useCallback } from 'react';

/**
 * ファイルシステム操作に関するビジネスロジックを扱うフック
 */
export const useFileSystem = () => {
    const { setFolderHandle, setFileName, setContent, setDirty } = useEditorStore();

    /**
     * ルートディレクトリを選択して開く
     */
    const openFolder = useCallback(async () => {
        try {
            const handle = await fileSystemService.requestFolderHandle();
            if (!handle) return;

            setFolderHandle(handle);

            // ルート直下に index.html があればデフォルトで開く候補にする
            // (要件では「開くボタン」でファイルを選択させるが、まずはハンドル保持が優先)
            // ここでは簡易的に images フォルダの存在確認も行う
            await fileSystemService.ensureImagesDirectory(handle);

            setDirty(false);
            console.log('Folder opened successfully');
        } catch (error) {
            console.error('Failed to open folder:', error);
            alert('フォルダのアクセス権限を確認してください。');
        }
    }, [setFolderHandle, setDirty]);

    /**
     * 指定したファイルを開く
     */
    const openFile = useCallback(async (fileName: string) => {
        const { folderHandle } = useEditorStore.getState();
        if (!folderHandle) return;

        try {
            const content = await fileSystemService.readFile(folderHandle, fileName);
            setContent(content);
            setFileName(fileName);
            setDirty(false);
        } catch (error) {
            console.error('Failed to read file:', error);
            alert('ファイルの読み込みに失敗しました。');
        }
    }, [setContent, setFileName, setDirty]);

    /**
     * 現在のファイルを上書き保存
     */
    const saveCurrentFile = useCallback(async () => {
        const { folderHandle, fileName, content } = useEditorStore.getState();
        if (!folderHandle || !fileName) {
            alert('保存先のファイルが指定されていません。');
            return;
        }

        try {
            await fileSystemService.saveFile(folderHandle, fileName, content);
            setDirty(false);
            console.log('File saved successfully');
        } catch (error) {
            console.error('Failed to save file:', error);
            alert('保存に失敗しました。');
        }
    }, [setDirty]);

    return {
        openFolder,
        openFile,
        saveCurrentFile,
    };
};
