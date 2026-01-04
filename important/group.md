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
<content>複数要素選択時、複数要素選択メニューが一瞬しか表示されず、すぐ個別メニューに遷移してしまうので、複数選択時は、常に複数選択メニューを表示するように修正する。
</content>
<current-situation>
- `handleMouseUp` にガードを追加し、Shiftキー押下時や複数要素選択時は個別選択への自動切り替えをスキップするようにしたことで、複数選択メニューが安定して表示されるようになった。
</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **目的**: 2段階選択ならびにグループ移動の安定化（フリッカーと移動制限の解消）
  - **変更内容**: `MouseDown` 時の状態を `Ref` で記録し、1回目クリックでの誤遷移（フリッカー）を防止。また、`selectionKey` を固定し `updateRect()` で同期する方式により、移動が中断されるバグを解消。
  - **変更日時**: 2026-01-04
- **目的**: 複数要素選択メニュー（Shift+Click）の表示安定化
  - **変更内容**: `handleMouseUp` にガードを追加。複数選択時やShiftキー押下時は MouseUp での個別選択切り替えロジックをバイパスし、現在の複数選択状態を維持するように修正。
  - **変更日時**: 2026-01-04
- **目的**: グループ移動中、オレンジ枠と要素がズレる（不一致）問題の修正
  - **変更内容**: `GroupMoveable.tsx` のドラッグ方式を完全に `left/top` ベースに統一し、操作中の React 再レンダリングを停止。これにより `transform` との競合がなくなり、移動中のズレを解消。
  - **変更日時**: 2026-01-04
- **目的**: 2回目クリック時、個別要素の青枠（ハンドル）が即座に表示されない問題の修正
  - **変更内容**: `IndividualMoveable.tsx` のマウント時に `updateRect()` を強制実行。モード切り替え直後に即座に UI が反映されるようになった。
  - **変更日時**: 2026-01-04

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- **MouseDown と MouseUp の役割分離**: `MouseDown` で選択を行い、`MouseUp` で「モードの切り替え（Group -> Individual）」を行う設計の場合、共通のガード（Shiftキーや複数選択状態のチェック）を両方に入れておかないと、MouseUp が意図せず選択状態を上書きしてしまう。
- `react-moveable` のターゲットに対して、React の `render` ループから同時に `left/top` を更新しようとすると、`transform` と競合して位置が激しくブレる。操作中は React の再レンダリングを控え、イベントハンドラ内での DOM 操作に専念させるのが正解。
- モード切り替え（Group -> Individual）の際、`target` が変わっても Moveable 内部の計算用キャッシュが古い場合があるため、明示的な `updateRect()` が不可欠。
- `dangerouslySetInnerHTML` で HTML を一括更新する設計上、各要素の DOM 参照は頻繁に無効化される。そのため、ID ベースで常に最新の要素を検索し直す必要がある。

## 4. 解決済み要件とその解決方法
- **要件**: グループ選択の2段階切り替え（1回目：グループ、2回目：個別）
  - **解決方法**: `useMoveable.ts` に `wasAlreadySelectedRef` を導入し、クリック開始時の状態を保持。2回目のフルクリック（Down & Up & No Drag）が完了した時点でのみ個別モードへ移行させる。
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
