import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';

/**
 * フォルダ内のHTMLファイルと画像アセットを管理するフック
 * プロジェクトフォルダ管理システムに対応
 */
export const useAssets = () => {
    const projectDirectoryHandle = useEditorStore((state) => state.projectDirectoryHandle);
    const [htmlFiles, setHtmlFiles] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<string[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    const refreshAssets = useCallback(async () => {
        if (!projectDirectoryHandle) {
            setHtmlFiles([]);
            setImageFiles([]);
            setImageUrls({});
            return;
        }

        try {
            // HTMLファイルの取得
            const allFiles = await fileSystemService.listFiles(projectDirectoryHandle);
            setHtmlFiles(allFiles.filter(f => f.toLowerCase().endsWith('.html')).sort());

            // 画像ファイルの取得（images/ フォルダがなければ自動作成）
            const imagesHandle = await fileSystemService.ensureImagesDirectory(projectDirectoryHandle);
            const images = (await fileSystemService.listFiles(imagesHandle))
                .filter(f => /\.(png|jpe?g|gif|svg|webp)$/i.test(f))
                .sort();
            setImageFiles(images);

            // プレビューURLの更新（古いURLは破棄）
            setImageUrls(prev => {
                Object.values(prev).forEach(URL.revokeObjectURL);
                return {};
            });

            const urls: Record<string, string> = {};
            for (const img of images) {
                // ファイル名から安全にURLを生成
                try {
                    urls[img] = await fileSystemService.getFileUrl(imagesHandle, img);
                } catch (e) {
                    console.warn(`Failed to get URL for ${img}`, e);
                }
            }
            setImageUrls(urls);
        } catch (error) {
            console.error('Failed to refresh assets:', error);
        }
    }, [projectDirectoryHandle]);

    // フォルダハンドルが変わったとき、または手動更新時に実行
    useEffect(() => {
        refreshAssets();
        return () => {
            setImageUrls(prev => {
                Object.values(prev).forEach(URL.revokeObjectURL);
                return {};
            });
        };
    }, [refreshAssets]);

    return {
        htmlFiles,
        imageFiles,
        imageUrls,
        refreshAssets
    };
};
