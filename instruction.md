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

## 変更反映領域を拡張する
- 現在、<!-- DESIGN_START -->～<!-- DESIGN_END -->の変更のみを反映するが、新たにスタイルタグ内に、あらかじめ、<!-- CUSTOM_CSS_START -->～<!-- CUSTOM_CSS_END -->を用意するようにメタメッセージ挿入ロジックを変更し、このエリアもエディタ上で変更を反映するようにする。
- また、以下のテンプレも<!-- USER_REQUIREMENT_START -->～<!-- USER_REQUIREMENT_END -->で囲み、この部分もエディタで変更を反映するようにする。
{
  "requirements": [],
  "notes": [],
  "concept": "",
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#1f2937",
    "accent": "#fbbf24"
  },
  "remarks": ""
}
- したがって、3エリアが変更反映領域となり、それ以外の領域の変更は引き続き無視する。

## AIへのメタメッセージを追加する
- 現在は出力HTMLにAI用メモのみ記載されているが、以下の編集ルールも追記する。
- 編集ルール
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

</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

- フォントは以下の15種類から選ぶ。
    - Noto Sans JP・Noto Serif JP・游ゴシック (Yu Gothic)・游明朝 (Yu Mincho)・メイリオ (Meiryo)・M PLUS 1p・Zen 角ゴシック New・Inter・Montserrat・Roboto・Playfair Display・Oswald・Poppins・JetBrains Mono・Times New Roman
  
  **テキストボックス内には子要素は配置できない。**

  - 各テキストボックス、各画像、各デザイン素材は必ず独立した要素として扱う。

  - 画像に関しては、Antigravityが開いてるフォルダのルートに「images」フォルダを作成し、そこに画像データを置き、デザインHTMLでパスで参照する。

  - 生成した各要素には一意のIDを付与する。


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026/01/03: 変更反映領域の拡張とAIメタメッセージの追加
    - `constructFullHTML` を拡張し、`DESIGN_START`, `CUSTOM_CSS_START`, `USER_REQUIREMENT_START` の3領域を出力するように変更。
    - HTMLのhead内にAI向けの編集ルール（メタメッセージ）をコメントとして追加。
    - `extractCustomCss` を追加し、外部ファイルからのCSS同期に対応。
    - `parseMetaMessage` を拡張し、`USER_REQUIREMENT_START` コメントブロックからのJSON抽出に優先対応。
    - `DesignArea` に `customCss` を適用する `<style>` タグを追加し、エディタ上でもCSSが即時反映されるようにした。
    - `useEditorStore` と `useFileSystem` を更新し、`customCss` の状態管理と保存・読込処理を統合。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `constructFullHTML` と `extractDesignContent` (および `parseMetaMessage`) を拡張して、3つの領域（DESIGN, CUSTOM_CSS, USER_REQUIREMENT）を扱えるようにする必要がある。
- AIへのメタメッセージ（編集ルール）は、HTMLのコメントとして埋め込むことで、AIが読み取れるようにする。
- `MetaMessage` 型は既存のままで要件を満たしているが、`CUSTOM_CSS` を保持するために `EditorState` に `customCss` フィールドを追加する必要がある。
- JSONデータを `<!-- USER_REQUIREMENT_START -->` で囲む際、`JSON.parse` が失敗しないように抽出ロジックを工夫する。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/utils/htmlProcessing.ts`: HTMLのパース、抽出、構築（今回の大規模修正対象）
- `src/types/editor.ts`: エディタの状態、メタメッセージの型定義（`customCss` 追加）
- `src/store/useEditorStore.ts`: グローバル状態管理（`customCss` の保持と更新ロジック）
- `src/hooks/useFileSystem.ts`: ファイルの保存・読み込みロジック（新抽出・構築関数の利用）

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **React/Zustand**: エディタの状態管理
- **Native File System API**: ローカルファイルへのアクセス
- **Regex/DOMParser**: HTMLコンテンツの抽出・クリーンアップ
- **Meta-Messaging**: HTMLコメントを介したAIへのインストラクション伝達
