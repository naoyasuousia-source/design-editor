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
- 固定ルール、共同編集ルール、デザインコンセプトは、それぞれ、追記形式でなく、単一のテキストボックスのみとする。
- 3つすべて、500文字制限とする。
- 3つすべて、UIでは、4行のみ表示し、縦スクロールバーを表示する。（UI上の表示領域は常に固定サイズ）
</content>
<current-situation>実装済み。MetaMessageEditor.tsx を刷新し、全ての指示項目を単一の textarea に統合。500文字制限と固定高スクロールを適用しました。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>
- AIへの指示メニューは、縦横スクロールを廃止し、常にメニュー内すべてを表示する。</content>
<current-situation>実装済み。モーダルの `max-height` と `overflow-y-auto` を削除し、コンテンツを2カラムレイアウトにすることで一覧性を高めました。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **目的**: 指示項目のUIをシンプルにし、文字数制限と視覚的固定性を確保する。
- **変更内容**: `MetaMessageEditor.tsx` を刷新。追記型リストを廃止し、`textarea`（500字制限、4行固定高）に変更。全体のレイアウトを2カラム化。
- **目的**: 固定ルールをJSON領域から隔離し、AIの誤操作を防ぐ。
- **変更内容**: `htmlProcessing.ts` の `constructFullHTML` にて、保存時に `fixedRules` を除外した JSON を出力するように修正。
- **変更日時**: 2026-01-04 23:00

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

## 4. 解決済み要件とその解決方法
- **AIによる固定ルールの不当な編集を防止する仕組みの強化**
  - **解決方法**: `src/utils/htmlProcessing.ts` において、`FIXED_RULES_START` ブロックを AI 用メタ情報の最上部かつ、JSON 領域（`USER_REQUIREMENT_START`）の「外側」に配置。
  - **解決方法**: 保存時に JSON データから `fixedRules` を物理的に除去することで、AI が JSON を一括更新する際に固定ルールを上書きできないようにした。
  - **解決方法**: システムプロンプトにおける強調（ABSOLUTE PRIORITY）により遵守を徹底。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/types/editor.ts`: メタメッセージの型定義（fixedRules含）。
- `src/store/useEditorStore.ts`: エディタの状態管理（指示内容の保持）。
- `src/utils/htmlProcessing.ts`: HTMLのパースおよび生成ロジック（固定ルールの外出し処理）。
- `src/components/common/MetaMessageEditor.tsx`: 「AIへの指示」UIコンポーネント。
- `src/hooks/useFileSystem.ts`: 上書き保存処理の橋渡し。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **動作原理**: 指示情報は HTML 内にコメントとして埋め込まれる。UI上は `textarea` で編集されるが、保存時に `fixedRules` のみ JSON から隔離され、コメントブロックのみに書き出される。これによりAIへの提示（読み込み）は維持しつつ、書き換え（保存）を物理的に阻止している。UIは `maxLength` と CSS (`h-[100px]`) により視覚的・機能的な制約を設けている。
