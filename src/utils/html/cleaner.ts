/**
 * エディタ専用の属性や要素を除去してクリーンな HTML にする
 */
export const cleanHTML = (html: string): string => {
    let cleaned = html;
    // contentEditable 属性の除去
    cleaned = cleaned.replace(/\scontenteditable="[^"]*"/g, '');
    // spellcheck 属性の除去
    cleaned = cleaned.replace(/\sspellcheck="[^"]*"/g, '');
    // エディタ用の一時的な data 属性を除去 (data-group-id は維持)
    cleaned = cleaned.replace(/\sdata-(?!group-id|group-type)[a-zA-Z0-9-]+="[^"]*"/g, '');
    // デザイン領域のクラスをクリーンアップ
    cleaned = cleaned.replace(/class="[^"]*DesignSurface[^"]*"/g, 'class="DesignSurface"');
    // デザイン領域のスタイルをリセット (固定サイズは CSS 側で制御するため 100% 指定を消去)
    cleaned = cleaned.replace(/style="[^"]*DesignSurface[^"]*"/g, 'style="position: relative; overflow: hidden;"');
    // 空の style 属性の除去
    cleaned = cleaned.replace(/\sstyle=""/g, '');
    return cleaned.trim();
};

/**
 * HTML 内の Blob URL を元の相対パス (./images/xxx) に書き戻す
 */
export const restoreRelativePaths = (html: string, imageUrls: Record<string, string>): string => {
    let restored = html;
    if (!imageUrls || Object.keys(imageUrls).length === 0) return html;

    // 長いURLから順にソート（部分一致での誤爆を防ぐため）
    const sortedEntries = Object.entries(imageUrls).sort((a, b) => b[1].length - a[1].length);

    for (const [fileName, blobUrl] of sortedEntries) {
        if (!blobUrl) continue;

        // 1. 素の Blob URL を置換
        const escapedBlob = blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        restored = restored.replace(new RegExp(escapedBlob, 'g'), `./images/${fileName}`);

        // 2. ブラウザによってエンコードされた Blob URL も置換対象にする (スペースが %20 になっている等)
        try {
            const encodedBlob = encodeURI(blobUrl).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (encodedBlob !== escapedBlob) {
                restored = restored.replace(new RegExp(encodedBlob, 'g'), `./images/${fileName}`);
            }
        } catch (e) {
            // ignore
        }
    }
    return restored;
};
