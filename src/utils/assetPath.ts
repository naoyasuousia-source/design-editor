/**
 * HTML 文字列内の画像パス（./images/...）を Blob URL に置換する純粋関数
 */
export const replaceAssetPaths = (
    html: string,
    imageUrls: Record<string, string>
): string => {
    let result = html;

    // 1. src="./images/xxx" の置換
    result = result.replace(/src=["'](?:\.\/)?images\/(.+?)["']/g, (match, fileName) => {
        const blobUrl = imageUrls[fileName];
        return blobUrl ? `src="${blobUrl}"` : match;
    });

    // 2. background-image: url(...) の置換
    result = result.replace(/url\((['"]|&quot;|&#39;)?((?:\.\/)?images\/.+?)\1?\)/gi, (match, _quote, fullPath) => {
        try {
            // HTMLエンティティの正規化とデコード
            const cleanPath = fullPath.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const decodedPath = decodeURIComponent(cleanPath);
            const fileName = decodedPath.replace(/^(\.\/)?images\//, '').split(/[?#]/)[0].trim();
            const blobUrl = imageUrls[fileName];
            return blobUrl ? `url('${blobUrl}')` : match;
        } catch (e) {
            return match;
        }
    });

    return result;
};
