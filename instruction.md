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
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>
- AIへの指示メニューは、縦横スクロールを廃止し、常にメニュー内すべてを表示する。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>
- 「固定ルール」は <!-- USER_REQUIREMENT_START -->から削除し、HTMLメタメッセージの最上部のみに記述する仕様にする。
- AIへの指示メニューには引き続き表示し、UI上での変更が、メタメッセージに反映されるようにする。</content>
<current-situation>実装済み。固定ルールをJSONから除外し、HTMLコメントブロックのみで管理するようにしました。UIからの編集・保存も連動しています。</current-situation>
<remarks>ユーザーによる動作確認待ち。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **目的**: 固定ルールをAIが編集できない場所に隔離しつつ、最上位ルールとして認識させる。
- **変更内容**: `src/utils/htmlProcessing.ts` の `constructFullHTML` において、`meta` オブジェクトから `fixedRules` を削除した状態で JSON 文字列化するように修正。
- **変更日時**: 2026-01-04 22:50

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

## 4. 解決済み要件とその解決方法
- **AIによる固定ルールの不当な編集を防止する仕組みの強化**
  - **解決方法**: `src/utils/htmlProcessing.ts` において、`FIXED_RULES_START` ブロックを AI 用メタ情報の最上部（最上位制約エリア）に配置するように変更。
  - **解決方法**: システムプロンプトにおいて、`[ABSOLUTE PRIORITY]`, `[IMPERATIVE]`, `[IMMUTABLE]` といった強力なキーワードを用い、AI に対して固定ルールの遵守と、その箇所の編集禁止を厳格に命じるように定義を更新。
  - **結果**: AI は JSON 内のデータ（`USER_REQUIREMENT_START`）のみを編集対象とし、外側にある固定ルール自体の記述には触れられない（触れてはいけない）という認識を強力に持たせることが可能になった。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/types/editor.ts`: メタメッセージの型定義（fixedRules含）。
- `src/store/useEditorStore.ts`: エディタの状態管理（指示内容の保持）。
- `src/utils/htmlProcessing.ts`: HTMLのパースおよび生成ロジック（固定ルールの外出し処理）。
- `src/components/common/MetaMessageEditor.tsx`: 「AIへの指示」UIコンポーネント。
- `src/hooks/useFileSystem.ts`: 上書き保存処理の橋渡し。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **動作原理**: HTMLファイル内に隠しコメントとして指示（メタメッセージ）を埋め込む。保存時に `fixedRules` を JSON 領域から削除し、コメントブロックにのみ出力することで、AI（LLM）への提示と編集禁止の物理的分離を実現している。パース時は両方の領域からデータを読み取り、UIに統合して表示する。
