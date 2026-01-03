<uneditable>

## 概要
これは、解決困難な要件を効率的に解決するためのファイルである。要件に関する重要事項を随時追記修正することで、AIが状況を動的に把握しやすくするとともに、他のモデルも即座に状況を把握できるようにする。

## 厳守ルール
- <uneditable>タグ内は絶対に編集しないこと。
- このファイル内の<## 見出し>は絶対に編集しないこと。
- rules.mdに従うこと。**rules.mdの例外事項をよく読むこと**
- ローカルサーバーは絶対に立ち上げないこと。
- ユーザーからの指示があるまで、セクション1,4は編集しないこと。

## セクション1記述方法

<requirement>
<content></content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

</uneditable>

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件（移動許可がNGの要件は絶対に移動・編集しないこと）（勝手に移動許可をOKに書き換えないこと）

<requirement>
<content>

### メタメッセージに以下のルールも加筆する。

- フォントは以下の15種類から選ぶ。
    - Noto Sans JP・Noto Serif JP・游ゴシック (Yu Gothic)・游明朝 (Yu Mincho)・メイリオ (Meiryo)・M PLUS 1p・Zen 角ゴシック New・Inter・Montserrat・Roboto・Playfair Display・Oswald・Poppins・JetBrains Mono・Times New Roman
  
- テキストボックス内には子要素は配置できない。

- 各テキストボックス、各画像、各デザイン素材は必ず独立した要素として扱う。

- 画像に関しては、Antigravityが開いてるフォルダのルートに「images」フォルダを作成し、そこに画像データを置き、デザインHTMLでパスで参照する。

- 生成した各要素には一意のIDを付与する。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>




## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026/01/03: 変更反映領域の拡張とAIメタメッセージの追加
    - `constructFullHTML` を拡張し、`DESIGN_START`, `CUSTOM_CSS_START`, `USER_REQUIREMENT_START` の3領域を出力するように変更。
    - HTMLのhead内にAI向けの編集ルール（メタメッセージ）をコメントとして追加。
    - `extractCustomCss` を追加し、外部ファイルからのCSS同期に対応。
    - `parseMetaMessage` を拡張し、`USER_REQUIREMENT_START` コメントブロックからのJSON抽出に優先対応。
    - `DesignArea` に `customCss` を適用する `<style>` タグを追加し、エディタ上でもCSSが即時反映されるようにした。
    - `useEditorStore` と `useFileSystem` を更新し、`customCss` の状態管理と保存・読込処理を統合。
- 2026/01/03: AIメタメッセージ（編集ルール）の強化
    - フォント制限、画像パス、ID付与、要素の独立性に関する規定を `constructFullHTML` の出力コメントに追加。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `constructFullHTML` と `extractDesignContent` (および `parseMetaMessage`) を拡張して、3つの領域（DESIGN, CUSTOM_CSS, USER_REQUIREMENT）を扱えるようにする必要がある。
- AIへのメタメッセージ（編集ルール）は、HTMLのコメントとして埋め込むことで、AIが読み取れるようにする。
- `MetaMessage` 型は既存のままで要件を満たしているが、`CUSTOM_CSS` を保持するために `EditorState` に `customCss` フィールドを追加する必要がある。
- JSONデータを `<!-- USER_REQUIREMENT_START -->` で囲む際、`JSON.parse` が失敗しないように抽出ロジックを工夫する。
- 新しく追加された編集ルール（フォント制限、画像フォルダの扱い、ID付与等）を `constructFullHTML` 内のメッセージに追加する必要がある。

## 4. 解決済み要件とその解決方法
- 変更反映領域を拡張する
    - `constructFullHTML` で `DESIGN`, `CUSTOM_CSS`, `USER_REQUIREMENT` の3領域を出力。
    - 各領域の抽出ロジック（`extractDesignContent`, `extractCustomCss`, `parseMetaMessage`）を実装・拡張。
    - Store と `useFileSystem` でこれらの領域の値を管理・同期するように修正。
    - エディタ上の `DesignArea` で `customCss` を `<style>` タグとして反映。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/utils/htmlProcessing.ts`: HTMLのパース、抽出、構築（今回の大規模修正対象）
- `src/types/editor.ts`: エディタの状態、メタメッセージの型定義（`customCss` 追加）
- `src/store/useEditorStore.ts`: グローバル状態管理（`customCss` の保持と更新ロジック）
- `src/hooks/useFileSystem.ts`: ファイルの保存・読み込みロジック（新抽出・構築関数の利用）

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **React/Zustand**: エディタの状態管理
- **Native File System API**: ローカルファイルへのアクセス
- **Regex/DOMParser**: HTMLコンテンツの抽出・クリーンアップ
- **Meta-Messaging**: HTMLコメントを介したAIへのインストラクション伝達（編集ルール、JSONメタデータ）
- **Design Rules**: フォント制限、独立要素、画像パス指定などの制約の定義
