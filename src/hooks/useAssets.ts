import { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';

// 外部で状態を共有するための簡易的なフラグ（複数の useAssets が同時に refresh するのを防ぐ）
let isRefreshingAssets = false;

/**
 * フォルダ内のHTMLファイルと画像アセットを管理するフック
 * 中央ストア（useEditorStore）を通じてステートを全コンポーネントで共有する
 */
export const useAssets = () => {
    const projectDirectoryHandle = useEditorStore((state) => state.projectDirectoryHandle);
    const imageUrls = useEditorStore((state) => state.imageUrls);
    const imageFiles = useEditorStore((state) => state.imageFiles);
    const htmlFiles = useEditorStore((state) => state.htmlFiles);
    const setAssets = useEditorStore((state) => state.setAssets);

    const refreshAssets = useCallback(async (force = false) => {
        if (!projectDirectoryHandle) {
            setAssets({
                htmlFiles: [],
                imageFiles: [],
                imageUrls: {}
            });
            return;
        }

        // 強制更新でない場合、既に読み込み中ならスキップ
        if (isRefreshingAssets && !force) return;

        isRefreshingAssets = true;

        try {
            // HTMLファイルの取得
            const allFiles = await fileSystemService.listFiles(projectDirectoryHandle);
            const nextHtmlFiles = allFiles.filter(f => f.toLowerCase().endsWith('.html')).sort();

            // 画像ファイルの取得
            const imagesHandle = await fileSystemService.ensureImagesDirectory(projectDirectoryHandle);
            const nextImageFiles = (await fileSystemService.listFiles(imagesHandle))
                .filter(f => /\.(png|jpe?g|gif|svg|webp)$/i.test(f))
                .sort();

            const urls: Record<string, string> = {};
            for (const img of nextImageFiles) {
                try {
                    // 既存の URL があればそれを使う（無駄な Blob 生成と衝突を避ける）
                    // ※ 注意: ファイルの中身が変わった場合はこれでは不十分だが、
                    // エディタの構成上、同一ファイル名で中身が変わることは少ない（新規追加がメイン）ため、
                    // パフォーマンスと副作用の安定性を優先。
                    if (imageUrls[img]) {
                        urls[img] = imageUrls[img];
                    } else {
                        urls[img] = await fileSystemService.getFileUrl(imagesHandle, img);
                    }
                } catch (e) {
                    console.warn(`Failed to get URL for ${img}`, e);
                }
            }

            setAssets({
                htmlFiles: nextHtmlFiles,
                imageFiles: nextImageFiles,
                imageUrls: urls
            });
        } catch (error) {
            console.error('Failed to refresh assets:', error);
        } finally {
            isRefreshingAssets = false;
        }
    }, [projectDirectoryHandle, setAssets, imageUrls]);

    // フォルダハンドルが変わったとき、または初回 mount 時に実行
    useEffect(() => {
        // まだ読み込まれていない場合のみ自動実行
        if (projectDirectoryHandle && Object.keys(imageUrls).length === 0) {
            refreshAssets();
        }
    }, [projectDirectoryHandle, refreshAssets, imageUrls]);

    return {
        htmlFiles,
        imageFiles,
        imageUrls,
        refreshAssets
    };
};
