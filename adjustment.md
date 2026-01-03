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
<content>コード編集の副作用として、「開く」メニューでデザインファイルを開いた場合に、必ず白紙になってしまう。開くの際のロジックがおかしくなってと思うから修正してほしい。</content>
<current-situation>
- 新規作成は正常で、保存も正常
- しかし、「開く」から開くと、白紙になってしまう。
- 開くの際のbodyの抽出、レンダリングがおかしいのではないか。
</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **2026-01-03: ページサイズ管理の修正（完了）**
    - `src/types/editor.ts`: `MetaMessage` に `pageSize` 項目を追加。
    - `src/hooks/useFileSystem.ts`: 
        - `handleNew` で選択された `pageSize` をストアに保存し、`metaMessage` に反映。
        - `handleOverwrite` で現在の `pageSize` を `metaMessage` にマージして保存。
        - `handleOpen` で HTML から `pageSize` を復元する処理を追加。
    - `src/store/useEditorStore.ts`: `detectExternalUpdate` (AI更新) 時にメタデータから `pageSize` を取得・更新するよう修正。
    - `src/utils/htmlProcessing.ts`: AI 向けのメタデータ（HTMLコメント）に、現在のキャンバスの幅と高さ（px）を含めるよう修正。

- **2026-01-03: 「開くと白紙になる」問題の修正（再修正）**
    - `src/hooks/useAutoSync.ts`: リファクタリングミスによる `checkFile` の未定義エラー（ReferenceError）を修正。
    - `src/utils/htmlProcessing.ts`: `extractDesignContent` をさらに堅牢に。`DOMParser` 使用時にダミーのルート要素で包むことで、HTML フラグメントのパース精度を向上させ、正しく `.DesignSurface` を抽出・剥離できるように改善。また、正規表現のフォールバックも強化。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- `extractDesignContent` で `DOMParser` を使用するようにしたが、これが環境や HTML 構造によって空を返している可能性がある。
- `useAutoSync` の初期化時に `lastModifiedRef` が 0 の状態で比較が走り、同一内容なのに「外部更新あり」として `detectExternalUpdate` が誤爆している可能性がある。
- `handleOpen` で `pageSize` を更新した際、`Workspace` の再レンダリングと content の反映タイミングがズレていないか確認が必要。

## 4. 解決済み要件とその解決方法

### 比率選択（A4, 9:16等）が正方形になってしまう問題の解決
- **原因**: 
    - 新規作成時に `setPageSize` が呼ばれていなかった。
    - HTML ファイル（メタデータ）に比率情報が保存されていなかったため、リロードや開き直しで `SQUARE` にリセットされていた。
- **解決策**:
    - `MetaMessage` に `pageSize` を持たせ、保存・読込時にストアと同期するようにした。
    - `handleNew` で明示的に `setPageSize` を呼ぶように修正した。
    - AI が比率を認識できるよう、HTML コメントにピクセルサイズを明記するようにした。

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
