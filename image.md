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
<content>画像メニューの角の丸みボタンは、図形要素と全く同じロジックを適用し、すたいだーで連続的に変更可能にする。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>画像メニューのトリミングボタンは、「画像として保存」メニューと全く同じロジックを適用する。（比率はfreeと1:1のみでOK）</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>画像は、一方向への伸長収縮は認めてないので、ポイントは四隅のみにする。</content>
<current-situation>現在は、左右上下にも存在する。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **画像のリサイズハンドルを四隅のみに制限** (2026-01-04): `useSelection.ts` の `getRenderDirections` を修正。
- **画像の角の丸みボタンをスライダー化** (2026-01-04): `FloatingMenu.tsx` を修正し、画像要素でも `RadiusPicker` を使用するように変更。
- **画像トリミングに比率指定（Free, 1:1）を追加** (2026-01-04): `ImagePositionPanel.tsx` を拡張し、アスペクト比選択ボタンと 1:1 調整ロジックを実装。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- **角の丸み**: `RadiusPicker.tsx` ですでにスライダーが実装されているため、`FloatingMenu.tsx` で画像に対してもこのコンポーネントを使用するように変更すればよい。
- **リサイズポイント**: `useSelection.ts` の `getRenderDirections` で対象が画像の場合に四隅（`nw, ne, sw, se`）のみを返すように条件分岐を追加する。
- **トリミング**: `ImagePositionPanel.tsx` を拡張し、`ImageSaveWizard.tsx` にあるような比率選択（Free, 1:1）ボタンを追加する。UIデザインも `ImageSaveWizard` に寄せることで統一感を出す。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/components/features/FloatingMenu.tsx`: 要素選択時に表示されるフローティングメニューのメインコンポーネント。
- `src/components/features/floating-menu/RadiusPicker.tsx`: 角の丸みを調整するスライダーパネル。
- `src/components/features/floating-menu/ImagePositionPanel.tsx`: 画像のトリミング・比率・配置を調整するパネル。
- `src/hooks/moveable/useSelection.ts`: Moveableのリサイズハンドルや選択状態を管理するフック。
- `src/components/features/ImageSaveWizard.tsx`: キャンバス全体の保存・トリミングを管理するウィザード（比率選択UIの参考先）。

## 6. 要件に関する機能의 技術スタックと動作原理（依存関係含む）
- **react-moveable**: 要素のドラッグ・リサイズを実現。`renderDirections` でハンドルの表示を制御。
- **CSS Object-fit/Position**: 画像のトリミング・配置（`cover`, `object-position`）を実現。
- **Tailwind CSS**: プレミアムなUIデザイン（スライダー、ボタン、アニメーション）に使用。
