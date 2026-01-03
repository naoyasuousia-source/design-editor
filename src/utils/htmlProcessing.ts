import { type MetaMessage, PAGE_SIZES } from '@/types/editor';

/**
 * HTML からメタメッセージ（JSON）を抽出する
 * <!-- USER_REQUIREMENT_START --> を優先し、なければ従来の script タグから取得する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        // AI_METADATA_START ブロックを無視するために、まずそれを取り除くか、
        // 後方のマッチを優先する
        const matches = Array.from(html.matchAll(/<!-- USER_REQUIREMENT_START -->([\s\S]*?)<!-- USER_REQUIREMENT_END -->/g));

        // 複数ある場合は最後の方（実際のデータ領域）から試行する
        for (let i = matches.length - 1; i >= 0; i--) {
            const content = matches[i][1].trim();
            try {
                return JSON.parse(content);
            } catch (e) {
                // 指示文などの非JSONはスキップして次（前）を探す
                continue;
            }
        }

        // 2. 従来の script タグからの抽出を試行（念のため）
        const scriptMatch = html.match(/<script id="ai-link-metadata" type="application\/json">([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
            let jsonText = scriptMatch[1].trim();
            // コメントタグが残っている可能性を除去
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
 */
export const extractDesignContent = (html: string): string => {
    // 1. デザインタグの間を優先的に取得
    // 指示文に含まれるタグとの混同を避けるため、matchAll で最後の方から有効なものを探す
    const matches = Array.from(html.matchAll(/<!-- DESIGN_START -->([\s\S]*?)<!-- DESIGN_END -->/g));

    let content = html;
    if (matches.length > 0) {
        // 最後のマッチ（通常は後ろの方にある実際のデザイン領域）を採用
        content = matches[matches.length - 1][1].trim();
    }

    if (!content) return "";

    // 2. もし HTML 全体っぽければ body の中身だけにする
    if (matches.length === 0 && (content.toLowerCase().includes('<body') || content.toLowerCase().includes('<html'))) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
            content = bodyMatch[1].trim();
        }
    }

    // 3. .DesignSurface ラッパーを剥がす
    // DOMParser を使って安全に判定
    try {
        const parser = new DOMParser();
        // フラグメントとしてパースするためにダミーの親で包む（重要）
        const doc = parser.parseFromString(`<div id="__root__">${content}</div>`, 'text/html');
        // __root__ 直下の最初の要素が .DesignSurface かチェック
        const root = doc.getElementById('__root__');
        if (root) {
            const surface = root.querySelector('.DesignSurface');
            if (surface) {
                // DesignSurface の中身を返す
                return surface.innerHTML.trim();
            }
        }
    } catch (e) {
        console.warn('extractDesignContent: DOMParser failed, using fallback', e);
    }

    // fallback: シンプルな正規表現での剥離
    const surfaceMatch = content.match(/^<div[^>]*class="[^"]*DesignSurface[^"]*"[^>]*>([\s\S]*)<\/div>$/i);
    if (surfaceMatch) {
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
    - 以下の「タグ」に囲まれた領域「のみ」を編集し、それ以外は一切変更しないこと。
        1. [DESIGN_START] ～ [DESIGN_END]
        2. [CUSTOM_CSS_START] ～ [CUSTOM_CSS_END]
        3. [USER_REQUIREMENT_START] ～ [USER_REQUIREMENT_END]
    - 注意: [ ] は実際の HTML コメントタグ <!-- ... --> に置き換えて認識してください。

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
