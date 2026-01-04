import { type MetaMessage, PAGE_SIZES } from '@/types/editor';

/**
 * 要素のスタイルを解析し、キャンバスサイズ内に強制的に収める
 */
const sanitizeStyles = (styleStr: string, canvasWidth: number, canvasHeight: number): string => {
    const styles: Record<string, string> = {};
    styleStr.split(';').forEach(s => {
        const [k, v] = s.split(':').map(str => str.trim());
        if (k && v) styles[k.toLowerCase()] = v;
    });

    const getPx = (val: string | undefined): number | null => {
        if (!val) return null;
        const match = val.match(/^(-?\d+(\.\d+)?)px$/);
        return match ? parseFloat(match[1]) : null;
    };

    let left = getPx(styles['left']);
    let top = getPx(styles['top']);
    let width = getPx(styles['width']);
    let height = getPx(styles['height']);

    // 1. サイズのクランプ (キャンバスより大きくならないように)
    if (width !== null) width = Math.min(width, canvasWidth);
    if (height !== null) height = Math.min(height, canvasHeight);

    // 2. 座標のクランプと押し戻し (はみ出し防止)
    if (left !== null) {
        if (width !== null) {
            // width がある場合は、右端を超えないように押し戻す
            if (left + width > canvasWidth) left = canvasWidth - width;
        }
        // 左端を超えないように (マイナス座標防止)
        left = Math.max(0, Math.min(left, canvasWidth));
    }

    if (top !== null) {
        if (height !== null) {
            // height がある場合は、下端を超えないように押し戻す
            if (top + height > canvasHeight) top = canvasHeight - height;
        }
        // 上端を超えないように (マイナス座標防止)
        top = Math.max(0, Math.min(top, canvasHeight));
    }

    // スタイル文字列を再構築
    if (left !== null) styles['left'] = `${left}px`;
    if (top !== null) styles['top'] = `${top}px`;
    if (width !== null) styles['width'] = `${width}px`;
    if (height !== null) styles['height'] = `${height}px`;

    return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('; ');
};

/**
 * HTML からメタメッセージ（JSON）を抽出する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        let meta: MetaMessage = {
            fixedRules: '',
            collaborativeRules: '',
            designConcept: '',
            colors: {
                main: 'none',
                sub: 'none',
                accent: 'none',
            },
            colorKit: 'custom'
        };

        // 1. FIXED_RULES_START から固定ルールを抽出
        const fixedMatch = html.match(/<!-- FIXED_RULES_START -->([\s\S]*?)<!-- FIXED_RULES_END -->/);
        if (fixedMatch && fixedMatch[1]) {
            meta.fixedRules = fixedMatch[1].trim();
        }

        // 2. USER_REQUIREMENT_START から JSON を抽出
        const matches = Array.from(html.matchAll(/<!-- USER_REQUIREMENT_START -->([\s\S]*?)<!-- USER_REQUIREMENT_END -->/g));

        for (let i = matches.length - 1; i >= 0; i--) {
            const content = matches[i][1].trim();
            try {
                const json = JSON.parse(content);
                // レガシーなフィールドの移行
                if (json.requirements && !json.collaborativeRules) {
                    json.collaborativeRules = json.requirements;
                }
                if (json.concept && !json.designConcept) {
                    json.designConcept = json.concept;
                }
                if (json.colors && json.colors.primary) {
                    json.colors.main = json.colors.primary;
                    json.colors.sub = json.colors.secondary;
                }

                // 配列形式だった場合の互換性維持
                if (Array.isArray(json.fixedRules)) {
                    json.fixedRules = json.fixedRules.join('\n');
                }
                if (Array.isArray(json.collaborativeRules)) {
                    json.collaborativeRules = json.collaborativeRules.join('\n');
                }

                return { ...meta, ...json };
            } catch (e) {
                continue;
            }
        }

        // 3. 従来の script タグからの抽出を試行（念のため）
        const scriptMatch = html.match(/<script id="ai-link-metadata" type="application\/json">([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
            let jsonText = scriptMatch[1].trim();
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_START -->/g, '');
            jsonText = jsonText.replace(/<!-- USER_REQUIREMENT_END -->/g, '');
            const json = JSON.parse(jsonText.trim());
            return { ...meta, ...json };
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
            const target = (surface || root) as HTMLElement;

            // キャンバスサイズを取得
            const meta = parseMetaMessage(html);
            const pageSize = meta?.pageSize || 'SQUARE';
            const config = PAGE_SIZES[pageSize];

            // すべての直下要素に対してスタイルクランプを適用
            Array.from(target.children).forEach(el => {
                const element = el as HTMLElement;
                const style = element.getAttribute('style');
                if (style) {
                    element.setAttribute('style', sanitizeStyles(style, config.width, config.height));
                }
            });

            if (surface) {
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
 * (廃止予定: 常に空文字を返す)
 */
export const extractCustomCss = (_html: string): string => {
    return '';
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
 * (廃止) 入れ子構造のHTMLをフラットにする処理は、AIに最初からフラットに書かせる方針に変更したため削除。
 */

export const constructFullHTML = (content: string, _customCss: string, meta: MetaMessage): string => {
    const cleanContent = cleanHTML(content);

    // content がすでに DesignSurface クラスを含むか確認
    const hasDesignSurface = cleanContent.includes('class="DesignSurface"') ||
        cleanContent.includes("class='DesignSurface'") ||
        cleanContent.includes('class="absolute inset-0 w-full h-full DesignSurface"');

    // DesignSurface がない場合のみラップする
    const wrappedContent = hasDesignSurface
        ? cleanContent
        : `<div class="DesignSurface" style="position: relative; overflow: hidden;">
        ${cleanContent}
    </div>`;

    // meta から fixedRules を除外したコピーを作成
    const { fixedRules: _, ...metaWithoutFixedRules } = meta;

    // キャンバスサイズに応じた告知メッセージ（セクション0）
    const pageSize = meta.pageSize || 'SQUARE';
    const config = PAGE_SIZES[pageSize];
    let sizeInfo = '';
    switch (pageSize) {
        case 'A4': sizeInfo = 'A4 (794 x 1123px)'; break;
        case '9:16': sizeInfo = 'Vertical 9:16 (630 x 1120px)'; break;
        case 'SQUARE': default: sizeInfo = 'Square 1:1 (800 x 800px)'; break;
    }

    const sizeMessage = `
0. CANVAS DIMENSIONS (ABSOLUTE CONSTRAINT)
- Current Canvas Size: ${sizeInfo}
- Width: ${config.width}px, Height: ${config.height}px
- [CRITICAL] All elements MUST be placed WITHIN these boundaries.
- [PROHIBITION] Never set positions or sizes exceeding these limits.
`.trim();

    // プレビュー用のスタイル（固定サイズ）
    const surfaceStyles = `
        .DesignSurface { 
            position: relative; 
            background: white; 
            width: ${config.width}px; 
            height: ${config.height}px; 
            min-width: ${config.width}px; 
            min-height: ${config.height}px;
            flex-shrink: 0;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
        }
    `;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Project</title>
    <!-- AI_METADATA_START -->
    <!-- 
    [ABSOLUTE PRIORITY: FIXED RULES]
    以下の指示は、本デザインプロジェクトの最上位制約です。
    これらのルールに反する変更は「絶対的な禁止事項」です。
    -->
    <!-- FIXED_RULES_START -->
    ${meta.fixedRules || ''}
    <!-- FIXED_RULES_END -->

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;700&family=M+PLUS+1p:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Montserrat:wght@400;500;700&family=Roboto:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;500;700&family=Poppins:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" crossorigin="anonymous">

    <!-- 
    ${sizeMessage}
    [NOTICE] 万が一計算ミスではみ出した場合、システムにより自動的にキャンバス内に押し戻されますが、デザイナーとして最初からこの範囲内に収まるよう厳密に計算してください。
    -->

    <!-- 
    ### SYSTEM RULES: DESIGN GENERATION
    
    [IMPORTANT] あなたは一流のデザイナーとして、以下のルールを「厳格に」順守してHTMLデザインを生成してください。

    1. MISSION
    - **Mission**: ユーザーの要求を完璧に反映したデザインを作成する。
    - **Boundaries**: すべての要素を必ずキャンバスサイズ（セクション0参照）内に収めること。
    - **No CSS Block**: <style> タグ内でのスタイル定義を禁止します。
    - **Inline Styles Only**: すべての装飾、レイアウト、文字装飾は要素の style 属性（インラインスタイル）で行ってください。
    - **Static Only**: HTMLとCSSのみを使用し、静的なデザインを生成すること。JSは不要。

    2. ALLOWED EDIT AREAS (STRICT)
    - 以下の「タグ」に囲まれた領域「のみ」を編集し、それ以外は一切変更しないこと。
        1. [DESIGN_START] ～ [DESIGN_END]
        2. [USER_REQUIREMENT_START] ～ [USER_REQUIREMENT_END]
    - **[IMPERATIVE]**: [FIXED_RULES_START] および [FIXED_RULES_END] タグ、それ自体のタグ文字、そしてその中身は「編集絶対禁止」です。
    - 注意: [ ] は実際の HTML コメント形式に置き換えて認識してください。

    3. COMPONENT CONSTRAINTS
    - **Elements**: テキストボックス、画像、図形の3種類のみ使用。
    - **IDs**: すべての要素に一意のID（id="el-..."）を付与し、独立した要素として扱うこと。
    - **[PROHIBITION] No Nesting**: **親子構造（要素の中に別の要素を入れること）は一切禁止**です。すべての要素は必ず .DesignSurface の「直下」にフラットに配置してください。
    - **Group IDs**: 関連する要素（例：背景、ロゴ、見出しなど）には、共通の data-group-id="group-..." を付与してください。
    - **Group ID Management**: 既存の要素に付与されている data-group-id は「絶対に」変更しないでください。新要素追加時は他のグループと被らない新しいIDを生成してください。
    - **No Flex/Grid**: 全要素を position: absolute で配置してください。FlexboxやGridによるレイアウトは使用せず、中央揃え等は left と width または text-align で実現してください。
    - **Appending**: 新しく要素を追加する場合は、必ず \`[DESIGN_START]\` 内の既存要素の「一番最後」に追記してください。
    - **No Nesting in Text**: 「テキストボックス内」に子要素（span等）を配置することは厳禁。
    - **Image Paths**: 画像は必ず ./images/ フォルダ内のファイルを参照すること。

    4. DESIGN & STYLING
    - **Fonts (EXCLUSIVE LIST)**: 以下の15種類からのみ選択すること。
        Noto Sans JP, Noto Serif JP, 游ゴシック (Yu Gothic), 游明朝 (Yu Mincho), メイリオ (Meiryo), M PLUS 1p, Zen 角ゴシック New, Inter, Montserrat, Roboto, Playfair Display, Oswald, Poppins, JetBrains Mono, Times New Roman
    - **Colors**: メイン、サブ、アクセントの3色構成を基本とし、一貫性を保つこと。
    - **Consistency**: 共通の配色は各要素のインラインスタイルに直接記述してください。

    5. DATA STRUCTURE
    - **JSON Metadata**: [USER_REQUIREMENT_START] 内には、ユーザー要件をJSON形式で正確に記載すること。
    - [USER_REQUIREMENT_START] 内は、毎回必ず、すべての項目を最新に更新し、必ず「日本語」で記述すること。
    -->
    <!-- AI_METADATA_END -->

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: auto; background: #000; }
        body { 
            display: flex; 
            justify-content: center; 
            align-items: flex-start;
            padding: 80px 40px; 
            min-height: 100vh;
        }
        ${surfaceStyles}
    </style>
    <script id="ai-link-metadata" type="application/json">
        <!-- USER_REQUIREMENT_START -->
        ${JSON.stringify(metaWithoutFixedRules, null, 2)}
        <!-- USER_REQUIREMENT_END -->
    </script>
</head>
<body class="bg-black">
    <!-- DESIGN_START -->
    ${wrappedContent}
    <!-- DESIGN_END -->
</body>
</html>`;
};
