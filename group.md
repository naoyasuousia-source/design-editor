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

- 副作用として、また、「グループ選択状態」での、グループ全体ドラッグ移動ができなくなった。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>

- 「グループ選択状態」で、さらにグループ内の個別要素をクリックすると、外側のオレンジ枠は表示したまま、個別要素の青枠と青ポイントが表示され、個別要素選択状態をなる。</content>
<current-situation>
</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>


<requirement>
<content>

- 複数要素を、シフトキーを使って選択すると、「複数要素選択メニュー」（「グループ化」ボタン、削除ボタン）のみが表示され、グループ化および選択要素の一括削除が可能。
</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **目的**: グループ内個別要素の選択・編集機能の修正
  - **変更内容**: `useMoveable.ts` の `handleCanvasClick` において、オーバーレイ（`groupOverlay`）をクリックした場合に `elementFromPoint` を用いて背後の要素を特定するように修正。これにより、グループ選択状態からさらに要素をクリックして「個別選択モード」へ移行可能になった。
  - **変更日時**: 2026-01-04
- **目的**: 複数要素選択メニュー（グループ化ボタン等）の表示修正
  - **変更内容**: `useFloatingMenu.ts` の `isGrouped` 判定において、`data-group-id` が `null` の場合はグループ化されているとみなさないように修正。これにより、複数要素選択時に正しく `canGroup` が `true` となり、グループ化メニューが表示されるようになった。
  - **変更日時**: 2026-01-04

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `react-moveable` のオーバーレイ（特に `GroupMoveable` で生成する `groupOverlay`）は `pointer-events-auto` にしないとドラッグできないが、そうすると背後の要素へのクリックイベントが遮断される。これを解決するため、クリックイベント発生時に一時的に `pointer-events` を切り替えて背面要素を特定する手法を採用した。
- `isGrouped` の判定が「すべての要素のグループIDが一致していること」だけだと、全要素が `null` （未グループ）の場合も一致してしまい、複数選択メニューが出なくなるバグがあった。

## 4. 解決済み要件とその解決方法
- **要件**: グループ全体移動の有効化
  - **解決方法**: `MoveableManager.tsx` にて `selectionMode === 'group'` の際に `groupOverlay` の `pointer-events-none` を解除し、ドラッグ操作を受け取れるようにした。
- **要件**: 図形要素へのテキスト入力制限
  - **解決方法**: `useTextEditing.ts` の `handleDoubleClick` に `isTextBox` 判定を追加し、テキスト以外の要素が編集状態にならないようにした。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/hooks/moveable/useSelection.ts`: 要素の選択状態（単一、複数、グループ）を管理する。
- `src/hooks/useMoveable.ts`: react-moveable を制御し、要素の変形（移動、リサイズ等）を実行する。
- `src/components/features/workspace/MoveableManager.tsx`: 選択状態に応じて `GroupMoveable` や `IndividualMoveable` を切り替えるマネージャー。
- `src/components/features/workspace/GroupMoveable.tsx`: グループ選択時の Moveable コンポーネント。
- `src/components/features/workspace/IndividualMoveable.tsx`: 個別要素選択時の Moveable コンポーネント。
- `src/components/features/workspace/DesignArea.tsx`: 要素が描画されるメインのキャンバス。
- `src/components/features/FloatingMenu.tsx`: 選択された要素に基づくメニューを表示する。
- `src/store/useEditorStore.ts`: アプリ全体のステート（要素リスト、選択中ID等）を管理。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **React-Moveable**: 要素のUI的な操作（移動、リサイズ等）を担当。
- **Zustand**: `useEditorStore` を通じてグローバルな要素情報を管理。
- **Group Mechanism**: 要素は階層構造（親子）ではなく、`data-group-id` というカスタム属性によるフラットなグループ化を採用。
- **Selection Flow**:
    1. ホバー時: `useSelection` が `hoveredGroupId` を設定、Tailwindでオレンジ枠表示。
    2. クリック（1回目）: `selectedGroupId` を設定。`GroupMoveable` が発動。
    3. クリック（2回目/同一グループ内）: `selectedId` を設定。`IndividualMoveable` が発動。
