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
<content>画像メニューのトリミングを有効化する。（比率はfreeと1:1のみでOK）</content>
<current-situation>左上は固定されたが、右下をドラッグすると画像がトリミング枠とともに縮小されてしまい、元画像とずれてしまう。トリミング中は画像は絶対に縮小せず、もとのままにする。（トリミング枠だけ縮小し、トリミング枠をずらすことで位置調整する）</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>「画像として保存」の展開メニューが常に画面に表示されてしまっているので、修正して。</content>
<current-situation>早期リターンを追加し、保存モード時以外は表示されないよう修正済み。</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **画像のリサイズハンドルを四隅のみに制限** (2026-01-04): `useSelection.ts` の `getRenderDirections` を修正。
- **画像の角の丸みボタンをスライダー化** (2026-01-04): `FloatingMenu.tsx` を修正し、画像要素でも `RadiusPicker` を使用するように変更。
- **画像トリミングに比率指定（Free, 1:1）を追加** (2026-01-04): `ImagePositionPanel.tsx` を拡張し、アスペクト比選択ボタンと 1:1 調整ロジックを実装。
- **トリミングUIの洗練と不要なスライダーの削除** (2026-01-04): `ImagePositionPanel.tsx` から Horizontal/Vertical スライダーを廃止し、UIを `ImageSaveWizard` 風の rounded-full 基調に変更。
- **ImageSaveWizard風トリミングUI実装** (2026-01-04): `ImagePositionPanel.tsx` を全面書き換え。ドラッグ可能なトリミング領域、画像プレビュー、比率選択(Free/1:1)、適用/キャンセルボタンを実装。`object-fit: cover` + `object-position` でトリミングを実現。
- **ColorPalette/GroupMoveable型エラー修正** (2026-01-04): ビルドエラーを解消。
- **ImageSaveWizard常時表示バグ修正** (2026-01-04): `isImageSaveMode` による早期リターンを追加。
- **ImageCropOverlayのズレと追従性の改善** (2026-01-04): `requestAnimationFrame` による追従、`zoom` 計算の補正、背景ガイド画像の追加。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- **角の丸み**: `RadiusPicker.tsx` ですでにスライダーが実装されているため、`FloatingMenu.tsx` で画像に対してもこのコンポーネントを使用するように変更。
- **リサイズポイント**: 画像要素の `renderDirections` を四隅（`nw, ne, sw, se`）のみに制限することで、縦横比を維持しない不自然な変形を防止。
- **トリミング**: `ImagePositionPanel.tsx` を `ImageSaveWizard.tsx` のような比率選択 UI に。`object-position` のスライダーは直感的でないため廃止。
- **画像トリミングの実装方法**: 画像要素のトリミングは `object-fit: cover` + `object-position` でCSSレベルで実現。トリミング枠の相対位置からパーセントを算出。
- **操作性**: フローティングメニューで「画像上でトリミング」を押すと、その他の要素が減光（backdrop-blur）し、対象画像のみが強調されるモードに入ることでミス操作を防ぐ。
- **同期**: `Portal` 内での変更を `CustomEvent('canvas-update')` を通じて `useMoveable` に伝え、自動保存（`updateContentFromDOM`）をトリガーしている。

## 4. 解決済み要件とその解決方法
- **角の丸みスライダー対応**: `FloatingMenu.tsx` で画像要素に対しても `RadiusPicker` を表示するように変更し、スライダーで連続的な調整を可能にした。
- **リサイズハンドルの制限**: `useSelection.ts` で画像要素を判定し、リサイズハンドルを四隅（nw, ne, sw, se）のみに制限した。
- **直感的な画像トリミング**: キャンバス上の画像に直接重なる `ImageCropOverlay` を実装。`object-fit: cover` を維持したまま `object-position` を動的に変更することで、非破壊的なトリミングを実現。
- **ImageSaveWizardの表示制御**: エントリポイントおよびコンポーネント内での状態判定を見直し、不要なタイミングでツールバーが表示されないように修正。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/components/features/FloatingMenu.tsx`: 要素選択時に表示されるフローティングメニューのメインコンポーネント。
- `src/components/features/floating-menu/RadiusPicker.tsx`: 角の丸みを調整するスライダーパネル。
- `src/components/features/floating-menu/ImagePositionPanel.tsx`: 画像のトリミング・比率・配置を調整するパネル。
- `src/hooks/moveable/useSelection.ts`: Moveableのリサイズハンドルや選択状態を管理するフック。
- `src/components/features/ImageSaveWizard.tsx`: キャンバス全体の保存・トリミングを管理するウィザード（UIデザインの参考）。

## 6. 要件に関する機能의 技術スタックと動作原理（依存関係含む）
- **react-moveable**: 要素のドラッグ・リサイズを実現。`renderDirections` でハンドルの表示を制御。
- **CSS Object-fit**: 画像のトリミング（`cover`）と比率調整を実現。
- **Tailwind CSS**: プレミアムなUIデザイン（rounded-full, blue-600, shadow-lg）に使用。
