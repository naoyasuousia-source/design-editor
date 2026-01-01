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
 * DesignSurface ラッパーを除外し、純粋なコンテンツのみを返す
 */
export const extractDesignContent = (html: string): string => {
    // <!-- DESIGN_START --> と <!-- DESIGN_END --> の間を抽出
    const designMatch = html.match(/<!-- DESIGN_START -->([\s\S]*)<!-- DESIGN_END -->/);
    let content = designMatch && designMatch[1] ? designMatch[1].trim() : html;

    // DOM パーサーを使用して DesignSurface の中身を抽出
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="__root__">${content}</div>`, 'text/html');
        const surface = doc.querySelector('.DesignSurface');

        if (surface) {
            // DesignSurface の中身のみを返す
            return surface.innerHTML.trim();
        }
    } catch (e) {
        console.warn('DOM parsing failed, falling back to regex:', e);
    }

    // フォールバック: 正規表現での抽出
    const surfaceMatch = content.match(/<div[^>]*class="[^"]*DesignSurface[^"]*"[^>]*>([\s\S]*)<\/div>\s*$/);
    if (surfaceMatch && surfaceMatch[1]) {
        return surfaceMatch[1].trim();
    }

    return content;
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
    // エディタ用の一時的な data 属性を除去 (data-group-id は維持)
    cleaned = cleaned.replace(/\sdata-(?!group-id)[a-zA-Z0-9-]+="[^"]*"/g, '');
    // 空の style 属性の除去
    cleaned = cleaned.replace(/\sstyle=""/g, '');
    return cleaned.trim();
};

/**
 * メタメッセージとコンテンツを統合して、完全な HTML ファイルを作成する
 */
export const constructFullHTML = (content: string, meta: MetaMessage): string => {
    const cleanContent = cleanHTML(content);

    // content がすでに DesignSurface クラスを含むか確認
    const hasDesignSurface = cleanContent.includes('class="DesignSurface"') ||
        cleanContent.includes("class='DesignSurface'") ||
        cleanContent.includes('class="absolute inset-0 w-full h-full DesignSurface"'); // Workspace から取得した場合

    // DesignSurface がない場合のみラップする
    const wrappedContent = hasDesignSurface
        ? cleanContent
        : `<div class="DesignSurface" style="position: relative; width: 100%; height: 100%; overflow: hidden;">
        ${cleanContent}
    </div>`;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Project</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: auto; }
        body { background: #1a1a1a; display: flex; align-items: center; justify-content: center; padding: 20px; min-height: 100vh; }
        .DesignSurface { position: relative; background: white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); min-width: 400px; min-height: 400px; }
    </style>
    <script id="ai-link-metadata" type="application/json">
${JSON.stringify(meta, null, 2)}
    </script>
</head>
<body>
    <!-- DESIGN_START -->
    ${wrappedContent}
    <!-- DESIGN_END -->
</body>
</html>`;
};
