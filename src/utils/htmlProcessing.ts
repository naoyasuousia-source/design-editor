import { type MetaMessage, PAGE_SIZES } from '@/types/editor';

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
    ### SYSTEM RULES: DESIGN GENERATION
    
    [IMPORTANT] あなたは一流のデザイナーとして、以下のルールを「厳格に」順守してHTMLデザインを生成してください。

    0. CANVAS DIMENSIONS
    - **Width**: ${PAGE_SIZES[meta.pageSize || 'SQUARE'].width}px
    - **Height**: ${PAGE_SIZES[meta.pageSize || 'SQUARE'].height}px
    - **Note**: このサイズに合わせてレイアウトを最適化してください。

    1. MISSION
    - **Mission**: ユーザーの要求を完璧に反映したデザインを作成する。
    - **Static Only**: HTMLとCSSのみを使用し、静的なデザインを生成すること。JSは不要。

    2. ALLOWED EDIT AREAS (STRICT)
    - 以下のタグに囲まれた領域「のみ」を編集し、それ以外は一切変更しないこと。
        1. <!-- DESIGN_START --> ～ <!-- DESIGN_END -->
        2. <!-- CUSTOM_CSS_START --> ～ <!-- CUSTOM_CSS_END -->
        3. <!-- USER_REQUIREMENT_START --> ～ <!-- USER_REQUIREMENT_END -->

    3. COMPONENT CONSTRAINTS
    - **Elements**: テキストボックス、画像、図形の3種類のみ使用。
    - **IDs**: すべての要素に一意のID（id="el-..."）を付与し、独立した要素として扱うこと。
    - **No Nesting in Text**: 「テキストボックス内」に子要素（span等）を配置することは厳禁。
    - **Layering**: 要素を重ねる場合は、親要素内に子要素を記述する構造を使用する。
    - **Image Paths**: 画像は必ず ./images/ フォルダ内のファイルを参照すること。

    4. DESIGN & STYLING
    - **Fonts (EXCLUSIVE LIST)**: 以下の15種類からのみ選択すること。
        Noto Sans JP, Noto Serif JP, 游ゴシック (Yu Gothic), 游明朝 (Yu Mincho), メイリオ (Meiryo), M PLUS 1p, Zen 角ゴシック New, Inter, Montserrat, Roboto, Playfair Display, Oswald, Poppins, JetBrains Mono, Times New Roman
    - **Layout**: CSS Gridを積極的に活用し、モダンな黄金比を意識すること。
    - **Colors**: メイン、サブ、アクセントの3色構成を基本とし、一貫性を保つこと。
    - **Smart CSS**: <!-- CUSTOM_CSS_START --> 内でCSS変数を定義し、保守性の高いスタイルを構築すること。

    5. DATA STRUCTURE
    - **JSON Metadata**: <!-- USER_REQUIREMENT_START --> 内には、ユーザー要件をJSON形式で正確に記載すること。
    -<!-- USER_REQUIREMENT_START --> 内は、毎回必ず、すべての項目を最新に更新し、必ず「日本語」で記述すること。
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
