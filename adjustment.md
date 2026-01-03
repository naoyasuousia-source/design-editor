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
<content>現在、A4、9:16を選択しても、正方形のデザインになってしまうので、A4、9:16を選択した場合は、それぞれの比率のテンプレデザインになるようにする。</content>
<current-situation>
- 新規作成時に `pageSize` がストアに保存されていなかったため、常にデフォルトの `SQUARE` が適用されていた。
- 保存・読込時に `pageSize` 情報が HTML に記録されていなかったため、再開時に比率が維持されなかった。
- AI へのメタデータにキャンバスサイズが含まれていなかったため、AI が適切な比率で生成できない可能性があった。
</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **2026-01-03: ページサイズ管理の修正**
    - `src/types/editor.ts`: `MetaMessage` に `pageSize` 項目を追加。
    - `src/hooks/useFileSystem.ts`: 
        - `handleNew` で選択された `pageSize` をストアに保存し、`metaMessage` に反映。
        - `handleOverwrite` で現在の `pageSize` を `metaMessage` にマージして保存。
        - `handleOpen` で HTML から `pageSize` を復元する処理を追加。
    - `src/store/useEditorStore.ts`: `detectExternalUpdate` (AI更新) 時にメタデータから `pageSize` を取得・更新するよう修正。
    - `src/utils/htmlProcessing.ts`: AI 向けのメタデータ（HTMLコメント）に、現在のキャンバスの幅と高さ（px）を含めるよう修正。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- `Workspace.tsx` はストアの `pageSize` を直接参照してキャンバスサイズを決定しているため、ストアの値を正しく更新・維持することが重要。
- AI は HTML 内のコメントを読んでデザインを生成するため、そこに具体的なサイズを記述することで、比率に合わせたレイアウト生成が期待できる。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

- `src/types/editor.ts`: エディタの型定義（PageSize, MetaMessage 等）。
- `src/constants/editor.ts`: エディタの定数（DEFAULT_PAGE_SIZE 等）。
- `src/store/useEditorStore.ts`: エディタのグローバル状態管理（Zustand）。
- `src/hooks/useFileSystem.ts`: ファイルの保存・読込・新規作成のビジネスロジック。
- `src/utils/htmlProcessing.ts`: HTML のパース・構築、AI 用メタデータの管理。
- `src/utils/templates.ts`: 新規作成時の初期 HTML テンプレート。
- `src/components/features/Workspace.tsx`: 描画領域のコンテナ。サイズ適用を担当。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

- **ページサイズ管理**:
    - ユーザーが `Navbar` で比率を選択し `handleNew` を呼び出す。
    - `handleNew` が `setPageSize` を通じて `pageSize` を更新し、`Workspace.tsx` が即座にリアクティブにサイズを変更する。
    - 保存時には `MetaMessage` の一部として HTML 内に埋め込まれる（`constructFullHTML`）。
    - 読み込み時には `parseMetaMessage` によって HTML から抽出され、再び `setPageSize` に適用される。
- **AI 連携**:
    - HTML ファイル内の `<!-- AI_METADATA_START -->` ブロックに、AI 向けの指示とキャンバスサイズを記述している。
    - AI はこれをもとに、指定されたピクセルサイズに最適なデザイン（CSS Grid 等）を生成する。
