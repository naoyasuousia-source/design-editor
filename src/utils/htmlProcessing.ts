import type { MetaMessage } from '@/types/editor';

/**
 * HTML からメタメッセージ（JSON）を抽出する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        const match = html.match(/<script id="ai-link-metadata" type="application\/json">([\s\S]*?)<\/script>/);
        if (match && match[1]) {
            return JSON.parse(match[1].trim());
        }
    } catch (e) {
        console.error('Failed to parse meta message from HTML:', e);
    }
    return null;
};

/**
 * デザイン領域の HTML を抽出する
 */
export const extractDesignContent = (html: string): string => {
    const match = html.match(/<!-- DESIGN_START -->([\s\S]*)<!-- DESIGN_END -->/);
    if (match && match[1]) {
        return match[1].trim();
    }
    // <!-- DESIGN_START --> がない場合は DesignSurface クラスの中身を探す
    const designSurfaceMatch = html.match(/<div[^>]*class="[^"]*DesignSurface[^"]*"[^>]*>([\s\S]*)<\/div>/);
    if (designSurfaceMatch && designSurfaceMatch[1]) {
        return designSurfaceMatch[1].trim();
    }
    return html;
};

/**
 * エディタ専用の属性や要素を除去してクリーンな HTML にする
 */
export const cleanHTML = (html: string): string => {
    let cleaned = html;
    // contentEditable 属性の除去
    cleaned = cleaned.replace(/\scontenteditable="[^"]*"/g, '');
    // spellcheck 属性の除去
    cleaned = cleaned.replace(/\sspellcheck="[^"]*"/g, '');
    // 空の style 属性の除去（もしあれば）
    cleaned = cleaned.replace(/\sstyle=""/g, '');
    // 特定のクラス（Moveableなど）の除去は、DesignSurface の外側に配置することで対応を推奨するが、
    // もし内部に混入した場合はここで除去する
    return cleaned.trim();
};

/**
 * メタメッセージとコンテンツを統合して、完全な HTML ファイルを作成する
 */
export const constructFullHTML = (content: string, meta: MetaMessage): string => {
    const cleanContent = cleanHTML(content);
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Design Project</title>
    <script id="ai-link-metadata" type="application/json">
${JSON.stringify(meta, null, 2)}
    </script>
</head>
<body>
    <!-- DESIGN_START -->
    <div class="DesignSurface" style="position: relative; width: 100%; height: 100%; overflow: hidden; background: white;">
        ${cleanContent}
    </div>
    <!-- DESIGN_END -->
</body>
</html>`;
};
