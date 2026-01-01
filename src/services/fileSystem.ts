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
    }
};
