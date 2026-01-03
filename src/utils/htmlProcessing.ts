import type { MetaMessage } from '@/types/editor';

/**
 * HTML からメタメッセージ（JSON）を抽出する
 * <!-- USER_REQUIREMENT_START --> を優先し、なければ従来の script タグから取得する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        // 1. <!-- USER_REQUIREMENT_START --> からの抽出を試行
        const commentMatch = html.match(/<!-- USER_REQUIREMENT_START -->([\s\S]*?)<!-- USER_REQUIREMENT_END -->/);
        if (commentMatch && commentMatch[1]) {
            return JSON.parse(commentMatch[1].trim());
        }

        // 2. 従来の script タグからの抽出を試行
        const scriptMatch = html.match(/<script id="ai-link-metadata" type="application\/json">([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
            // script タグ内にコメントが含まれている可能性を考慮してクリーンアップ
            let jsonText = scriptMatch[1].trim();
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_START -->/g, '');
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_END -->/g, '');
            return JSON.parse(jsonText.trim());
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
    const designMatch = html.match(/<!-- DESIGN_START -->([\s\S]*?)<!-- DESIGN_END -->/);
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
 * カスタム CSS 領域を抽出する
 */
export const extractCustomCss = (html: string): string => {
    const match = html.match(/<!-- CUSTOM_CSS_START -->([\s\S]*?)<!-- CUSTOM_CSS_END -->/);
    return match ? match[1].trim() : '';
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
export const constructFullHTML = (content: string, customCss: string, meta: MetaMessage): string => {
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
    <!-- AI_METADATA_START -->
    <!-- 
    編集ルール:
    - あなたは一流デザイナーであり、ユーザーの要求に沿ってHTMLデザインを行う。
    - HTMLとCSSのみで静的なデザイン生成を行う。
    - 要素は、テキストボックス、画像、図形の三種類とする。
    - 親要素タグ内に子要素を記述することで、要素を重ねることができる。
    - <!-- DESIGN_START -->～<!-- DESIGN_END -->、<!-- CUSTOM_CSS_START -->～<!-- CUSTOM_CSS_END -->、<!-- USER_REQUIREMENT_START -->～<!-- USER_REQUIREMENT_END -->のみを編集すること。
    - 必要に応じてCSS Gridを使用
    - モダンな黄金比を意識
    - 基本的にメインカラー、サブカラー、アクセントカラーで構成すること
    - 必要に応じて<!-- CUSTOM_CSS_START -->～<!-- CUSTOM_CSS_END -->内にCSS変数を定義し、スマートなデザイン生成を構築する。
    - <!-- USER_REQUIREMENT_START -->～<!-- USER_REQUIREMENT_END -->内にユーザーの要件をJSON形式で記載し、その要件を満たすデザインを生成する。
        **すべて毎回更新すること**
        **絶対に日本語で記述すること**
    -->
    <!-- AI_METADATA_END -->
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: auto; }
        body { background: #1a1a1a; display: flex; align-items: center; justify-content: center; padding: 20px; min-height: 100vh; }
        .DesignSurface { position: relative; background: white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); min-width: 400px; min-height: 400px; }
        
        <!-- CUSTOM_CSS_START -->
        ${customCss}
        <!-- CUSTOM_CSS_END -->
    </style>
    <script id="ai-link-metadata" type="application/json">
        <!-- USER_REQUIREMENT_START -->
        ${JSON.stringify(meta, null, 2)}
        <!-- USER_REQUIREMENT_END -->
    </script>
</head>
<body>
    <!-- DESIGN_START -->
    ${wrappedContent}
    <!-- DESIGN_END -->
</body>
</html>`;
};
