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
<content>画像メニューで、「replace image」を完全に廃止する。デッドコードは削除する。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>AIへのメッセージに、「回転はtransform: rotate(Ndeg) のみ使用せよ。」という指示を追加する。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>回転メニューは、要素メニューに近接して表示する仕様に変更せよ。</content>
<current-situation>現在、回転ハンドル（要素の外部）のすぐ下に表示されている。</current-situation>
<remarks>要素メニュー（FloatingMenu）の横または直下に配置することで、操作の一貫性を高める。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>回転メニューはメニューが適用されても自動で閉じず、連続操作可能にせよ。</content>
<current-situation>90°回転、リセットのいずれでも一回クリックするとメニューが閉じてしまい連続クリック不可。おそらく `updateContentFromDOM` による全体再レンダリングで `IndividualMoveable` 等が再マウントされ、ローカルステート（`rotationPickerPos`）が失われている。</current-situation>
<remarks>再レンダリング後も選択状態が維持される仕組み（`autoSelectId` 等）はあるが、メニューの表示位置ステートを上位に持たせるか、再マウントを防ぐ必要がある。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- 目的: 現状把握のためのログ実装
  変更内容: `RotationPicker.tsx` および `rotationService.ts` に詳細な `console.log` を追加。
  変更日時: 2026-01-07 00:00

- 目的: 残りの回転操作UI要件の一括実装 & ビルドエラー修正
  変更内容: 
    1. `FloatingMenu.tsx`: 逆さま(135-225deg)時に位置を下側に変更。
    2. `RotationPicker.tsx`: 連続操作対応（ステートを `useSelection` に引き上げ）、要素メニューの横に表示。
    3. 各コンポーネントのインターフェースを整理し、TypeScriptのエラーを解消。
    4. ビルド（`npm run build`）の正常終了を確認。
  変更日時: 2026-01-07 00:50

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **解決済み（機能不全問題）**: 原因はマウスイベントの伝播（Bubbling）によってキャンバス側の選択解除が先に動いていたこと。`stopPropagation` で解決。
- **解決済み（機能不全問題）**: 原因はマウスイベントの伝播（Bubbling）によってキャンバス側の選択解除が先に動いていたこと。`stopPropagation` で解決。
- **解決済み（180°回転時の重なり）**: 要素の回転角に応じて、要素メニューの位置を上下に動的に切り替えるロジックを実装。
- **解決済み（連続操作不可）**: `rotationPickerPos` (座標) を `isRotationPickerOpen` (フラグ) に変更し、`useSelection` にステートを引き上げた。再レンダリング後もフラグが維持されるため、メニューが閉じなくなった。
- **解決済み（表示位置の変更）**: `RotationPicker` のレンダリングを `FloatingMenu` 内部（右横）に移動した。これにより座標計算が不要になり、常にメインメニューに近接して表示されるようになった。

## 4. 解決済み要件とその解決方法

- **要件**: 回転メニューの90°回転、リセットが全く機能しないので機能するようにする。
- **解決方法**: `RotationPicker` に `onMouseDown` と `onMouseUp` の `e.stopPropagation()` を追加し、背後のキャンバスによる選択解除ロジックが発火するのを阻止した。

- **要件**: 180°回転時、回転ハンドルが要素メニューに隠れないようにする。
- **解決方法**: `FloatingMenu.tsx` に `isUpsideDown` 判定（135-225deg）を追加し、逆さまの時はメニュー位置を要素の下側（`rect.bottom`）に移動するようにした。

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
