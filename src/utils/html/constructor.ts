import { type MetaMessage, PAGE_SIZES } from '@/types/editor';
import { cleanHTML } from './cleaner';

export const constructFullHTML = (content: string, _customCss: string, meta: MetaMessage): string => {
    const cleanContent = cleanHTML(content);

    const hasDesignSurface = cleanContent.includes('class="DesignSurface"') ||
        cleanContent.includes("class='DesignSurface'") ||
        cleanContent.includes('class="absolute inset-0 w-full h-full DesignSurface"');

    const wrappedContent = hasDesignSurface
        ? cleanContent
        : `<div class="DesignSurface" style="position: relative; overflow: hidden;">
        ${cleanContent}
    </div>`;

    const { fixedRules: _, ...metaWithoutFixedRules } = meta;

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
    - **[CRITICAL] No z-index**: **z-index の使用は一切禁止**です。重なり順は HTML の記述順序（後ろに書いたものが手前）のみで制御してください。
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
    - **[RULE] Rotation**: **回転は transform: rotate(Ndeg) のみ使用せよ。** 歪み(skew)や他の行列変換は使用しないこと。
    - **Group IDs**: 関連する要素（例：背景、ロゴ、見出しなど）には、共通の data-group-id="group-..." を付与してください。
    - **[RULE] Group Management**: 
        - **グループ要素は必ずHTML上で「連続して（ひとかたまりで）」記述してください。** 間に別グループや単独要素を挟まないこと。
        - **単独の要素（1つだけの要素）には絶対に data-group-id を付けないでください。** グループは必ず2つ以上の要素で構成される場合のみ使用します。
    - **Group ID Management**: 既存の要素に付与されている data-group-id は「絶対に」変更しないでください。新要素追加時は他のグループと被らない新しいIDを生成してください。
    - **No Flex/Grid**: 全要素を position: absolute で配置してください。FlexboxやGridによるレイアウトは使用せず、中央揃え等は left と width または text-align で実現してください。
    - **Appending**: 新しく要素を追加する場合は、必ず \`[DESIGN_START]\` 内の既存要素の「一番最後」に追記してください。
    - **No Nesting in Text**: 「テキストボックス内」に子要素（span等）を配置することは厳禁。
    - **Image Insert**: 
        - 画像生成＆挿入は、「画像を生成してデザインに挿入せよ」という **明示的な指示があった場合に限り** 実行すること。
        - **[CRITICAL] 画像保存先の絶対ルール**: 
            - **生成した画像は「必ず」「例外なく」「絶対に」 ./images/ フォルダに保存すること。**
            - **他のフォルダ（public/, assets/, src/ 等）への保存は一切禁止。**
            - **HTMLへの挿入時は必ず相対パス（例: ./images/filename.png）を使用すること。**
        - **背景透過が必要と判断した場合**: ファイル名を **transparent-〇〇.png** 形式で保存すること（例: transparent-apple.png）。エディタが自動的に背景透過処理を実行し、processed-〇〇.png として保存・置換します。

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
