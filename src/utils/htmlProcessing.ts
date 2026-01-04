import { type MetaMessage, PAGE_SIZES } from '@/types/editor';

/**
 * HTML からメタメッセージ（JSON）を抽出する
 * <!-- USER_REQUIREMENT_START --> を優先し、なければ従来の script タグから取得する
 */
export const parseMetaMessage = (html: string): MetaMessage | null => {
    try {
        let meta: MetaMessage = {
            fixedRules: [],
            collaborativeRules: [],
            designConcept: '',
            colors: {
                main: '#3b82f6',
                sub: '#1f2937',
                accent: '#fbbf24',
            }
        };

        // 1. FIXED_RULES_START から固定ルールを抽出
        const fixedMatch = html.match(/<!-- FIXED_RULES_START -->([\s\S]*?)<!-- FIXED_RULES_END -->/);
        if (fixedMatch && fixedMatch[1]) {
            meta.fixedRules = fixedMatch[1].trim().split('\n').map(line => line.replace(/^[*-]\s*/, '').trim()).filter(line => line !== '');
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
    cleaned = cleaned.replace(/\sdata-(?!group-id|group-type)[a-zA-Z0-9-]+="[^"]*"/g, '');
    // 空の style 属性の除去
    cleaned = cleaned.replace(/\sstyle=""/g, '');
    return cleaned.trim();
};

/**
 * 入れ子構造のHTMLを、絶対座標のフラットな構造に変換する
 * ルール:
 * 1. すべての要素を .DesignSurface の直下に配置
 * 2. 入れ子だった要素は、親のオフセットを加算して absolute 座標に変換
 * 3. スタイルを持つ親要素は「背面の図形」として維持、持たないコンテナは削除
 * 4. 元の親子関係を data-group-id で紐付け
 */
export const flattenHTML = (nestedHtml: string, customCss?: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
        <div id="__flatten_root__">
            <style>${customCss || ''}</style>
            <div class="DesignSurface" style="position: relative; width: 2000px; height: 2000px;">
                ${nestedHtml}
            </div>
        </div>
    `, 'text/html');

    const container = doc.getElementById('__flatten_root__');
    if (!container) return nestedHtml;

    // 実際にレイアウトを計算するために一時的にDOMに追加（隠し要素）
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.top = '-10000px';
    hiddenDiv.style.left = '-10000px';
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.innerHTML = container.innerHTML;
    document.body.appendChild(hiddenDiv);

    const surface = hiddenDiv.querySelector('.DesignSurface') as HTMLElement;
    const surfaceRect = surface.getBoundingClientRect();
    const flatElements: HTMLElement[] = [];

    // 元の親子関係を特定するためのIDを発行（なければ）
    const generateGroupId = () => `group-${Math.random().toString(36).substring(2, 9)}`;

    function collect(el: HTMLElement, parentGroupId?: string) {
        const children = Array.from(el.children) as HTMLElement[];
        const rect = el.getBoundingClientRect();

        // 有効な要素（IDがある、またはスタイル/テキストがある）
        const isDesignSurface = el.classList.contains('DesignSurface');
        const hasId = !!el.id;
        const style = window.getComputedStyle(el);
        const hasVisibleStyle = style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
            style.borderWidth !== '0px' ||
            style.backgroundImage !== 'none';
        const hasText = el.childNodes.length > 0 && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent?.trim());

        let currentGroupId = parentGroupId;

        if (!isDesignSurface && (hasId || hasVisibleStyle || hasText)) {
            // クローンを作成し、絶対座標を付与
            const clone = el.cloneNode(false) as HTMLElement;
            if (!clone.id) clone.id = `el-${Math.random().toString(36).substring(2, 9)}`;

            // 親が子を持っている場合、自身をグループIDとして子に継承
            if (children.length > 0 && !currentGroupId) {
                currentGroupId = generateGroupId();
            }
            if (currentGroupId) {
                clone.setAttribute('data-group-id', currentGroupId);
            }

            // スタイルの書き換え
            clone.style.position = 'absolute';
            clone.style.top = `${rect.top - surfaceRect.top}px`;
            clone.style.left = `${rect.left - surfaceRect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.margin = '0';

            // Flex/Grid などのレイアウトプロパティは不要になるのでクリア
            clone.style.display = (hasText && !hasVisibleStyle) ? 'block' : style.display;
            clone.style.flexDirection = '';
            clone.style.justifyContent = '';
            clone.style.alignItems = '';
            clone.style.gap = '';

            // テキストノードの同期
            if (hasText) {
                // 子要素以外のテキストのみを抽出して追加（簡易的）
                const textClone = el.cloneNode(true) as HTMLElement;
                Array.from(textClone.children).forEach(c => c.remove());
                clone.innerHTML = textClone.innerHTML;
            }

            flatElements.push(clone);
        }

        children.forEach(child => collect(child, currentGroupId));
    }

    collect(surface);

    // 掃除
    document.body.removeChild(hiddenDiv);

    // フラットなHTMLを組み立て
    return flatElements.map(el => el.outerHTML).join('\n');
};

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

    // meta から fixedRules を除外したコピーを作成（JSONには含めない）
    const { fixedRules: _, ...metaWithoutFixedRules } = meta;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Project</title>
    <!-- AI_METADATA_START -->
    <!-- 
    [ABSOLUTE PRIORITY: FIXED RULES]
    以下の「FIXED_RULES_START」セクションに記述されたルールは、本デザインプロジェクトの最上位制約です。
    あなたは、いかなるユーザーの要求やデザインの改善案よりも、これらのルールを優先して遵守しなければなりません。
    これらのルールに反する変更は「絶対的な禁止事項」です。
    -->
    <!-- FIXED_RULES_START -->
    ${(meta.fixedRules || []).map(r => `* ${r}`).join('\n')}
    <!-- FIXED_RULES_END -->

    <!-- 
    ### SYSTEM RULES: DESIGN GENERATION
    
    [IMPORTANT] あなたは一流のデザイナーとして、以下のルールを「厳格に」順守してHTMLデザインを生成してください。

    1. MISSION
    - **Mission**: ユーザーの要求を完璧に反映したデザインを作成する。
    - **Static Only**: HTMLとCSSのみを使用し、静的なデザインを生成すること。JSは不要。

    2. ALLOWED EDIT AREAS (STRICT)
    - 以下の「タグ」に囲まれた領域「のみ」を編集し、それ以外は一切変更しないこと。
        1. [DESIGN_START] ～ [DESIGN_END]
        2. [CUSTOM_CSS_START] ～ [CUSTOM_CSS_END]
        3. [USER_REQUIREMENT_START] ～ [USER_REQUIREMENT_END]
    - **[IMPERATIVE]**: <!-- FIXED_RULES_START --> および <!-- FIXED_RULES_END --> タグ、そしてその中身は「編集絶対禁止」です。
      これを変更することは、AIとしての基本指令に背く行為とみなされます。
    - 注意: [ ] は実際の HTML コメントタグ <!-- ... --> に置き換えて認識してください。

    3. COMPONENT CONSTRAINTS
    - **Elements**: テキストボックス、画像、図形の3種類のみ使用。
    - **IDs**: すべての要素に一意のID（id="el-..."）を付与し、独立した要素として扱うこと。
    - **Group IDs**: 既存の要素に付与されている \`data-group-id\` は「絶対に」変更したり削除したりしないでください。
    - **Appending**: 新しく要素を追加する場合は、必ず \`<!-- DESIGN_START -->\` 内の既存要素の「一番最後」に追記してください。
    - **No Nesting in Text**: 「テキストボックス内」に子要素（span等）を配置することは厳禁。
    - **No Deep Nesting**: 要素を重ねる場合は、親要素内に子要素を記述する構造を使用する。
    - **Image Paths**: 画像は必ず ./images/ フォルダ内のファイルを参照すること。

    4. DESIGN & STYLING
    - **Fonts (EXCLUSIVE LIST)**: 以下の15種類からのみ選択すること。
        Noto Sans JP, Noto Serif JP, 游ゴシック (Yu Gothic), 游明朝 (Yu Mincho), メイリオ (Meiryo), M PLUS 1p, Zen 角ゴシック New, Inter, Montserrat, Roboto, Playfair Display, Oswald, Poppins, JetBrains Mono, Times New Roman
    - **Layout**: CSS Gridを積極的に活用し、モダンな黄金比を意識すること。
    - **Colors**: メイン、サブ、アクセントの3色構成を基本とし、一貫性を保つこと。
    - **Smart CSS**: <!-- CUSTOM_CSS_START --> 内でCSS変数を定義し、保守性の高いスタイルを構築すること。

    5. DATA STRUCTURE
    - **JSON Metadata**: <!-- USER_REQUIREMENT_START --> 内には、ユーザー要件をJSON形式で正確に記載すること。
    - <!-- USER_REQUIREMENT_START --> 内は、毎回必ず、すべての項目を最新に更新し、必ず「日本語」で記述すること。
    - **Note**: あなたが編集してよいのは JSON の中身だけであり、外側の FIXED_RULES_START ブロックには一切触れてはいけません。
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
        ${JSON.stringify(metaWithoutFixedRules, null, 2)}
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
