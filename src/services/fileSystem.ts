/**
 * File System Access API を使用したファイル操作サービス
 */

export const fileSystemService = {
    /**
     * フォルダを選択し、ハンドルを取得する
     */
    async requestFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            return handle;
        } catch (err) {
            if ((err as Error).name === 'AbortError') return null;
            throw err;
        }
    },

    /**
     * 指定したハンドル内のファイルを読み込む
     */
    async readFile(folderHandle: FileSystemDirectoryHandle, fileName: string): Promise<string> {
        const fileHandle = await folderHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    },

    /**
     * フォルダ内のファイルを上書き保存する
     */
    async saveFile(folderHandle: FileSystemDirectoryHandle, fileName: string, content: string): Promise<void> {
        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    },

    /**
     * 指定したフォルダに images ディレクトリが存在するか確認し、なければ作成する
     */
    async ensureImagesDirectory(folderHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
        return await folderHandle.getDirectoryHandle('images', { create: true });
    },

    /**
     * 指定したハンドル内のファイルを一覧取得する
     */
    async listFiles(folderHandle: FileSystemDirectoryHandle): Promise<string[]> {
        const fileNames: string[] = [];
        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file') {
                fileNames.push(entry.name);
            }
        }
        return fileNames;
    },

    /**
     * ファイルのURLを取得する (Blob URL)
     */
    async getFileUrl(folderHandle: FileSystemDirectoryHandle, fileName: string): Promise<string> {
        const fileHandle = await folderHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return URL.createObjectURL(file);
    },

    /**
     * プロジェクトフォルダを選択し、フォルダハンドルを返す
     */
    async selectProjectFolder(): Promise<FileSystemDirectoryHandle | null> {
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            return handle;
        } catch (err) {
            if ((err as Error).name === 'AbortError') return null;
            console.error('プロジェクトフォルダの選択に失敗:', err);
            throw err;
        }
    },

    /**
     * プロジェクトフォルダに新規デザインファイルを作成
     * @param directoryHandle - プロジェクトフォルダハンドル
     * @param template - 初期テンプレートHTML
     * @returns ファイルハンドル
     */
    async createNewDesignFile(
        directoryHandle: FileSystemDirectoryHandle,
        template: string
    ): Promise<FileSystemFileHandle> {
        try {
            const timestamp = Date.now();
            const fileName = `untitled-${timestamp}.html`;

            const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(template);
            await writable.close();

            return fileHandle;
        } catch (err) {
            console.error('新規ファイルの作成に失敗:', err);
            throw err;
        }
    },

    /**
     * プロジェクトフォルダから既存ファイルを開く
     * @param directoryHandle - プロジェクトフォルダハンドル
     * @returns ファイルハンドルと内容
     */
    async openFileFromFolder(
        directoryHandle: FileSystemDirectoryHandle
    ): Promise<{ fileHandle: FileSystemFileHandle; content: string }> {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'HTML Files',
                        accept: { 'text/html': ['.html'] }
                    }
                ],
                startIn: directoryHandle,
                multiple: false
            });

            const file = await fileHandle.getFile();
            const content = await file.text();

            return { fileHandle, content };
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                throw new Error('ファイル選択がキャンセルされました');
            }
            console.error('ファイルを開くのに失敗:', err);
            throw err;
        }
    },

    /**
     * 現在開いているファイルに上書き保存
     * @param fileHandle - ファイルハンドル
     * @param htmlContent - 保存するHTML内容
     */
    async saveToCurrentFile(
        fileHandle: FileSystemFileHandle,
        htmlContent: string
    ): Promise<void> {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(htmlContent);
            await writable.close();
        } catch (err) {
            console.error('ファイルの保存に失敗:', err);
            throw err;
        }
    }
};
