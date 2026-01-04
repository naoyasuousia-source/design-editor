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
- グループ内要素ホバー：グループ外枠オレンジ枠のみ表示
- グループ内要素一クリック目：グループ外枠オレンジ枠＆四隅ポイント表示（グループ選択状態）
- グループ内要素二クリック目：個別要素選択メニュー表示
</content>
<current-situation>
- グループ選択状態、グループ移動時は、オレンジ枠とグループ外枠ずれないが、移動終了後のみ、移動前の位置でオレンジ枠＆四隅ポイントが表示されてしまう。
- 依然、二回目クリックで、個別要素選択メニューにならない。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **目的**: グループ内個別要素の選択・編集機能の修正
  - **変更内容**: `useMoveable.ts` の `handleCanvasClick` において、オーバーレイ（`groupOverlay`）をクリックした場合に `elementFromPoint` を用いて背後の要素を特定するように修正。これにより、グループ選択状態からさらに要素をクリックして「個別選択モード」へ移行可能になった。
  - **変更日時**: 2026-01-04
- **目的**: 複数要素選択メニュー（グループ化ボタン等）の表示修正
  - **変更内容**: `useFloatingMenu.ts` の `isGrouped` 判定において、`data-group-id` が `null` の場合はグループ化されているとみなさないように修正。これにより、複数要素選択時に正しく `canGroup` が `true` となり、グループ化メニューが表示されるようになった。
  - **変更日時**: 2026-01-04
- **目的**: デザインエリアでの MouseUp ハンドラ定義漏れ修正
  - **変更内容**: `DesignArea.tsx` の引数に `handleMouseUp` を追加し、実行時に発生していた `ReferenceError` を解消。
  - **変更日時**: 2026-01-04
- **目的**: グループ全体移動の副作用修正
  - **変更内容**: `useMoveable.ts` にて「グループから個別」への遷移を `MouseDown` ではなく `MouseUp` (かつ移動距離が短い場合) へ移動。これにより、`MouseDown` 時点ではグループモードが維持され、Moveable によるドラッグ移動が正常に開始されるようになった。
  - **変更日時**: 2026-01-04

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `react-moveable` のオーバーレイ（特に `GroupMoveable` で生成する `groupOverlay`）は `pointer-events-auto` にしないとドラッグできないが、そうすると背後の要素へのクリックイベントが遮断される。これを解決するため、クリックイベント発生時に一時的に `pointer-events` を切り替えて背面要素を特定する手法を採用した。
- `isGrouped` の判定が「すべての要素のグループIDが一致していること」だけだと、全要素が `null` （未グループ）の場合も一致してしまい、複数選択メニューが出なくなるバグがあった。

## 4. 解決済み要件とその解決方法
- **要件**: グループ全体移動の有効化
  - **解決方法**: `MoveableManager.tsx` にて `selectionMode === 'group'` の際に `groupOverlay` の `pointer-events-none` を解除。さらに `useMoveable.ts` でクリック判定を最適化し、ドラッグを阻害せずに2段階選択を実現した。
- **要件**: 図形要素へのテキスト入力制限
  - **解決方法**: `useTextEditing.ts` の `handleDoubleClick` に `isTextBox` 判定を追加し、テキスト以外の要素が編集状態にならないようにした。
- **要件**: グループ内個別要素の選択・編集機能（個別要素への切り替え）
  - **解決方法**: `useMoveable.ts` でオーバーレイをクリックした際に背後の要素を取得する `elementFromPoint` を実装し、2段階選択を可能にした。
- **要件**: 複数要素選択メニューの表示修正
  - **解決方法**: `useFloatingMenu.ts` の `isGrouped` 判定において、IDが `null` の場合はグループ化済みとみなさないよう修正し、複数選択メニューが出るようにした。

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
