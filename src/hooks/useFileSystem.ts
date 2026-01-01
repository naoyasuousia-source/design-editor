import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';
import { useCallback } from 'react';
import { parseMetaMessage, extractDesignContent, constructFullHTML } from '@/utils/htmlProcessing';

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
            const rawContent = await fileSystemService.readFile(folderHandle, fileName);

            // メタデータの抽出
            const meta = parseMetaMessage(rawContent);
            if (meta) {
                useEditorStore.getState().setMetaMessage(meta);
            }

            // コンテンツの抽出
            const designContent = extractDesignContent(rawContent);
            setContent(designContent, true); // 読込時は履歴に積まない

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
        const { folderHandle, fileName, content, metaMessage } = useEditorStore.getState();

        if (!folderHandle) {
            alert('まずプロジェクトフォルダを選択してください。');
            return;
        }

        if (!fileName) {
            return saveFileAs();
        }

        try {
            const fullHtml = constructFullHTML(content, metaMessage);
            await fileSystemService.saveFile(folderHandle, fileName, fullHtml);
            setDirty(false);
            console.log(`File saved successfully: ${fileName}`);
        } catch (error) {
            console.error('Failed to save file:', error);
            alert('保存に失敗しました。');
        }
    }, [setDirty]);

    /**
     * 名前を付けて保存
     */
    const saveFileAs = useCallback(async () => {
        const { folderHandle, content, metaMessage, fileName } = useEditorStore.getState();

        if (!folderHandle) {
            alert('まずプロジェクトフォルダを選択してください。');
            return;
        }

        const inputName = prompt('保存するファイル名を入力してください（例: index.html）', fileName || 'index.html');
        if (!inputName) return; // キャンセル

        const targetFileName = inputName.endsWith('.html') ? inputName : `${inputName}.html`;

        try {
            const fullHtml = constructFullHTML(content, metaMessage);
            await fileSystemService.saveFile(folderHandle, targetFileName, fullHtml);
            setFileName(targetFileName);
            setDirty(false);
            console.log(`File saved as: ${targetFileName}`);
        } catch (error) {
            console.error('Failed to save file:', error);
            alert('保存に失敗しました。');
        }
    }, [setDirty, setFileName]);

    return {
        openFolder,
        openFile,
        saveCurrentFile,
        saveFileAs,
    };
};
