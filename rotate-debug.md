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
<content>180°回転時、回転ハンドルが要素メニューに隠れてしまうので、いかなる場合でも、要素メニューに隠れないように工夫せよ。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>回転メニューは常に回転ハンドルのすぐ近くに表示されるようにせよ。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>回転メニューはメニューが適用されても自動で閉じず、連続操作可能にせよ。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>回転メニューの90°回転、リセットが全く機能しないので機能するようにする。</content>
<current-situation></current-situation>
<remarks>
- **UI検知→Hooks→reactレンダリング**の流れになっていること、reactの宣言的レンダリングが正常であるか、データが正しくどうきされているかを確認せよ。
- 原因不明の場合は、原因をあぶりだすために、コンソールログを実装せよ。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- 目的: 現状把握のためのログ実装
  変更内容: `RotationPicker.tsx` および `rotationService.ts` に詳細な `console.log` を追加。
  変更日時: 2026-01-07 00:00

- 目的: メニューボタンが機能しないバグの修正
  変更内容: `RotationPicker.tsx` のコンテナに `onMouseDown` と `onMouseUp` の `stopPropagation` を追加。
  変更日時: 2026-01-07 00:10

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **判明した原因候補1**: `handleCanvasClick` (DesignAreaの `onMouseDown` リスナー) が `RotationPicker` へのクリックを検知し、キャンバスの選択解除（`selectNone`）を実行していた可能性がある。これにより、ボタンの `onClick` イベントが到達する前にコンポーネントがアンマウントされていた。
- **仮説2**: `updateContentFromDOM` が呼び出されるタイミングで、まだDOMへの反映が完了していないか、あるいは `getCleanHTML` が回転スタイルを削ってしまっている。
- **仮説3**: `dangerouslySetInnerHTML` による再レンダリング時に、何らかの理由で変更前の状態に戻ってしまっている。
- **制約**: `rules.md` に従い、最後は React の宣言的レンダリングで確定させる必要がある。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

- `src/components/features/workspace/RotationPicker.tsx`: 回転操作メニュー（90度回転、リセットボタン）。
- `src/services/rotationService.ts`: 回転動作の実体（DOM操作、座標計算）。
- `src/utils/rotationUtils.ts`: 回転角度抽出、座標回転などの純粋関数。
- `src/components/features/workspace/IndividualMoveable.tsx`: 単一要素用 Moveable マネージャー、RotationPicker を表示。
- `src/components/features/workspace/GroupMoveable.tsx`: グループ要素用 Moveable マネージャー。
- `src/hooks/moveable/useTextEditing.ts`: `updateContentFromDOM`（DOMから最新状態を吸い上げてStoreに保存）の実装場所。
- `src/services/htmlService.ts`: `getCleanHTML`（保存用にHTMLを掃除）の実装。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

- **技術スタック**: React, Zustand, react-moveable, Lucide React
- **動作原理**:
  1. ユーザーが回転ハンドルをクリック。
  2. `RotationPicker` が表示され、ボタンクリックで `rotationService` のメソッド（命令的DOM操作）を呼び出す。
  3. `rotationService` が対象の HTMLElement に対して `style.transform` 等を直接変更する。
  4. 同時に `updateContentFromDOM` が発火し、`DesignSurface` 全体の最新HTMLを `htmlService.getCleanHTML` で取得。
  5. 取得した HTML が Zustand ストア（`content`）に保存される。
  6. React の `DesignContent` コンポーネントが `dangerouslySetInnerHTML` で最新の状態を画面に再描画（宣言的レンダリング）し、永続化を完了する。
