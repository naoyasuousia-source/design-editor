import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';
import { useCallback } from 'react';
import { parseMetaMessage, extractDesignContent, constructFullHTML } from '@/utils/htmlProcessing';
import { GET_INITIAL_TEMPLATE } from '@/utils/templates';
import type { PageSize } from '@/types/editor';

/**
 * ファイルシステム操作に関するビジネスロジックを扱うフック
 * プロジェクトフォルダ管理システムに対応
 */
export const useFileSystem = () => {
    const {
        content,
        setProjectDirectoryHandle,
        setCurrentFileHandle,
        setProjectFolderName,
        setContent,
        setDirty,
        setLastSaveTime,
        setMetaMessage
    } = useEditorStore();

    /**
     * 新規作成
     * 1. 比率を選択（呼び出し側で実施）
     * 2. プロジェクトフォルダを選択
     * 3. フォルダに新規ファイルを作成
     * 4. エディタに表示
     */
    const handleNew = useCallback(async (pageSize: PageSize) => {
        // 未保存の変更がある場合は警告
        if (content && !confirm('未保存の変更が失われますが、よろしいですか？')) {
            return;
        }

        try {
            // プロジェクトフォルダを選択
            const directoryHandle = await fileSystemService.selectProjectFolder();
            if (!directoryHandle) return; // キャンセル

            // ストアに保存
            setProjectDirectoryHandle(directoryHandle);
            setProjectFolderName(directoryHandle.name);

            // 新規ファイルを作成
            const template = GET_INITIAL_TEMPLATE(pageSize);
            const fullHTML = constructFullHTML(template, useEditorStore.getState().metaMessage);
            const fileHandle = await fileSystemService.createNewDesignFile(directoryHandle, fullHTML);

            // ファイルハンドルをストアに保存
            setCurrentFileHandle(fileHandle);

            // エディタにテンプレートを読み込み
            setContent(template, true); // 履歴に積まない
            setDirty(false);
            setLastSaveTime(Date.now());

            console.log('新規ファイルを作成しました:', fileHandle.name);
        } catch (error) {
            console.error('新規作成に失敗:', error);
            alert('新規ファイルの作成に失敗しました。');
        }
    }, [content, setProjectDirectoryHandle, setProjectFolderName, setCurrentFileHandle, setContent, setDirty, setLastSaveTime]);

    /**
     * 開く
     * 1. プロジェクトフォルダを選択
     * 2. フォルダ内からファイルを選択
     * 3. エディタに表示
     */
    const handleOpen = useCallback(async () => {
        // 未保存の変更がある場合は警告
        if (content && !confirm('未保存の変更が失われますが、よろしいですか？')) {
            return;
        }

        try {
            // プロジェクトフォルダを選択
            const directoryHandle = await fileSystemService.selectProjectFolder();
            if (!directoryHandle) return; // キャンセル

            // ストアに保存
            setProjectDirectoryHandle(directoryHandle);
            setProjectFolderName(directoryHandle.name);

            // フォルダ内からファイルを選択
            const { fileHandle, content: htmlContent } = await fileSystemService.openFileFromFolder(directoryHandle);

            // ファイルハンドルをストアに保存
            setCurrentFileHandle(fileHandle);

            // エディタに読み込み
            const designContent = extractDesignContent(htmlContent);
            const meta = parseMetaMessage(htmlContent);

            setContent(designContent, true); // 履歴に積まない
            if (meta) setMetaMessage(meta);
            setDirty(false);

            console.log('ファイルを開きました:', fileHandle.name);
        } catch (error) {
            const err = error as Error;
            if (err.message === 'ファイル選択がキャンセルされました') {
                // キャンセルは何もしない
                return;
            }
            console.error('ファイルを開くのに失敗:', error);
            alert('ファイルを開くのに失敗しました。');
        }
    }, [content, setProjectDirectoryHandle, setProjectFolderName, setCurrentFileHandle, setContent, setMetaMessage, setDirty]);

    /**
     * 上書き保存
     * 現在開いているファイルに保存
     */
    const handleOverwrite = useCallback(async () => {
        const { currentFileHandle, content, metaMessage } = useEditorStore.getState();

        console.log('handleOverwrite called');
        console.log('currentFileHandle:', currentFileHandle);
        console.log('content length:', content?.length);

        // ファイルハンドルの存在確認
        if (!currentFileHandle) {
            alert('保存先のファイルが見つかりません。\n新規作成または開くから始めてください。');
            return;
        }

        try {
            // HTML を構築
            const fullHTML = constructFullHTML(content, metaMessage);
            console.log('fullHTML constructed, length:', fullHTML.length);

            // 上書き保存
            await fileSystemService.saveToCurrentFile(currentFileHandle, fullHTML);

            setLastSaveTime(Date.now());
            setDirty(false);

            console.log('保存しました:', currentFileHandle.name);
        } catch (error) {
            console.error('保存に失敗:', error);
            alert(`保存に失敗しました。\n${(error as Error).message}`);
        }
    }, [setLastSaveTime, setDirty]);

    return {
        handleNew,
        handleOpen,
        handleOverwrite,
    };
};
