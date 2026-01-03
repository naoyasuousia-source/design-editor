import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';
import { useCallback } from 'react';
import { parseMetaMessage, extractDesignContent, constructFullHTML, extractCustomCss } from '@/utils/htmlProcessing';
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
        setMetaMessage,
        setCustomCss
    } = useEditorStore();

    /**
     * 新規作成
     * 1. 比率を選択（呼び出し側で実施）
     * 2. プロジェクトフォルダを選択
     * 3. ファイル名を入力
     * 4. フォルダに新規ファイルを作成
     * 5. エディタに表示
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

            // ファイル名を入力
            const timestamp = Date.now();
            const defaultFileName = `untitled-${timestamp}.html`;
            let fileName = prompt('ファイル名を入力してください:', defaultFileName);

            if (!fileName) return; // キャンセル

            // 拡張子を確認・補完
            fileName = fileName.trim();
            if (!fileName.endsWith('.html')) {
                fileName = `${fileName}.html`;
            }

            // 無効なファイル名のチェック
            if (fileName === '.html' || fileName.length === 0) {
                alert('有効なファイル名を入力してください。');
                return;
            }

            // 新規ファイルを作成
            const template = GET_INITIAL_TEMPLATE(pageSize);
            const { metaMessage, customCss } = useEditorStore.getState();
            const fullHTML = constructFullHTML(template, customCss, metaMessage);
            const fileHandle = await fileSystemService.createNewDesignFile(directoryHandle, fileName, fullHTML);

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
            const customCss = extractCustomCss(htmlContent);
            const meta = parseMetaMessage(htmlContent);

            setContent(designContent, true); // 履歴に積まない
            setCustomCss(customCss);
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
     * @returns 保存成功時は true、失敗時は false
     */
    const handleOverwrite = useCallback(async (): Promise<boolean> => {
        const { currentFileHandle, content, customCss, metaMessage, setShowSaveToast } = useEditorStore.getState();

        console.log('handleOverwrite called');
        console.log('currentFileHandle:', currentFileHandle);
        console.log('content length:', content?.length);

        // ファイルハンドルの存在確認
        if (!currentFileHandle) {
            alert('保存先のファイルが見つかりません。\n新規作成または開くから始めてください。');
            return false;
        }

        try {
            // 保存開始時刻を記録（同期スキップ用）
            setLastSaveTime(Date.now());

            // HTML を構築
            const fullHTML = constructFullHTML(content, customCss, metaMessage);
            console.log('fullHTML constructed, length:', fullHTML.length);

            // 上書き保存
            await fileSystemService.saveToCurrentFile(currentFileHandle, fullHTML);

            setLastSaveTime(Date.now());
            setDirty(false);

            console.log('保存しました:', currentFileHandle.name);

            // 保存成功トーストを表示
            setShowSaveToast(true);

            return true;
        } catch (error) {
            console.error('保存に失敗:', error);
            alert(`保存に失敗しました。\n${(error as Error).message}`);
            return false;
        }
    }, [setLastSaveTime, setDirty]);

    return {
        handleNew,
        handleOpen,
        handleOverwrite,
    };
};
