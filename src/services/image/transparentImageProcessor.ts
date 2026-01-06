/**
 * AI編集時の自動背景透過処理を担当するサービス
 * 「transparent-xxx」プレフィックスを検知し、背景透過後に「processed-xxx」として保存
 */
import { backgroundRemovalService } from '@/services/image/backgroundRemovalService';
import { fileSystemService } from '@/services/fileSystem';

interface TransparentImageProcessResult {
    /** 処理された画像の数 */
    processedCount: number;
    /** 更新後のHTMLコンテンツ */
    updatedContent: string;
    /** 処理結果のログ */
    logs: string[];
}

/**
 * HTML内の「transparent-」プレフィックス画像を検知し、背景透過処理を行う
 * @param content HTML文字列
 * @param projectDirectoryHandle プロジェクトディレクトリハンドル
 * @param imageUrls 既存の画像URL Map
 * @param onAssetsUpdated アセット更新完了時のコールバック（オプション）
 */
export const processTransparentImages = async (
    content: string,
    projectDirectoryHandle: FileSystemDirectoryHandle | null,
    imageUrls: Record<string, string>,
    onAssetsUpdated?: () => Promise<void>
): Promise<TransparentImageProcessResult> => {
    const logs: string[] = [];
    let updatedContent = content;
    let processedCount = 0;

    if (!projectDirectoryHandle) {
        logs.push('[processTransparentImages] No project directory handle. Skipping.');
        return { processedCount: 0, updatedContent: content, logs };
    }

    // HTML内から transparent- で始まる画像パスを抽出
    const transparentPattern = /(?:src=["']|url\(['"]?)(?:\.\/)?images\/(transparent-[^"'\s)]+)/gi;
    const matches = [...content.matchAll(transparentPattern)];

    if (matches.length === 0) {
        logs.push('[processTransparentImages] No transparent- prefixed images found.');
        return { processedCount: 0, updatedContent: content, logs };
    }

    logs.push(`[processTransparentImages] Found ${matches.length} transparent- prefixed image(s).`);

    // 重複を排除
    const uniqueFileNames = [...new Set(matches.map(m => m[1]))];

    try {
        const imagesHandle = await fileSystemService.ensureImagesDirectory(projectDirectoryHandle);

        for (const fileName of uniqueFileNames) {
            try {
                logs.push(`[processTransparentImages] Processing: ${fileName}`);

                // Blob URL を取得（既存アセットから or 新規読み込み）
                let blobUrl = imageUrls[fileName];
                if (!blobUrl) {
                    // アセットリストになければ直接読み込み
                    blobUrl = await fileSystemService.getFileUrl(imagesHandle, fileName);
                }

                if (!blobUrl) {
                    logs.push(`[processTransparentImages] Could not get Blob URL for: ${fileName}`);
                    continue;
                }

                // 背景透過処理を実行
                const transparentBlobUrl = await backgroundRemovalService.removeBackground(blobUrl);

                // 新しいファイル名を生成 (transparent- → processed-)
                const processedFileName = fileName.replace(/^transparent-/, 'processed-');

                // Blob を取得して保存
                const response = await fetch(transparentBlobUrl);
                const blob = await response.blob();

                const fileHandle = await imagesHandle.getFileHandle(processedFileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();

                logs.push(`[processTransparentImages] Saved as: ${processedFileName}`);

                // HTML内の参照を置換 (transparent-xxx → processed-xxx)
                const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const replacePattern = new RegExp(escapeRegex(fileName), 'g');
                updatedContent = updatedContent.replace(replacePattern, processedFileName);

                // 元ファイル（transparent-xxx）を削除
                try {
                    await imagesHandle.removeEntry(fileName);
                    logs.push(`[processTransparentImages] Deleted original: ${fileName}`);
                } catch (deleteErr) {
                    logs.push(`[processTransparentImages] Could not delete original: ${fileName}`);
                }

                processedCount++;
            } catch (err) {
                logs.push(`[processTransparentImages] Error processing ${fileName}: ${err}`);
            }
        }
    } catch (err) {
        logs.push(`[processTransparentImages] Failed to access images directory: ${err}`);
    }

    // アセット更新コールバックを実行
    if (processedCount > 0 && onAssetsUpdated) {
        try {
            await onAssetsUpdated();
            logs.push('[processTransparentImages] Assets refreshed.');
        } catch (err) {
            logs.push(`[processTransparentImages] Failed to refresh assets: ${err}`);
        }
    }

    logs.push(`[processTransparentImages] Completed. Processed ${processedCount} image(s).`);
    return { processedCount, updatedContent, logs };
};
