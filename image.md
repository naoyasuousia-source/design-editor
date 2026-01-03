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




## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- **画像のリサイズハンドルを四隅のみに制限** (2026-01-04): `useSelection.ts` の `getRenderDirections` を修正。
- **画像の角の丸みボタンをスライダー化** (2026-01-04): `FloatingMenu.tsx` を修正し、画像要素でも `RadiusPicker` を使用するように変更。
- **画像トリミングに比率指定（Free, 1:1）を追加** (2026-01-04): `ImagePositionPanel.tsx` を拡張し、アスペクト比選択ボタンと 1:1 調整ロジックを実装。
- **トリミングUIの洗練と不要なスライダーの削除** (2026-01-04): `ImagePositionPanel.tsx` から Horizontal/Vertical スライダーを廃止し、UIを `ImageSaveWizard` 風の rounded-full 基調に変更。
- **ImageSaveWizard風トリミングUI実装** (2026-01-04): `ImagePositionPanel.tsx` を全面書き換え。ドラッグ可能なトリミング領域、画像プレビュー、比率選択(Free/1:1)、適用/キャンセルボタンを実装。`object-fit: cover` + `object-position` でトリミングを実現。
- **ColorPalette/GroupMoveable型エラー修正** (2026-01-04): ビルドエラーを解消。
- **ImageSaveWizard常時表示バグ修正** (2026-01-04): `isImageSaveMode` による早期リターンを追加。
- **ImageCropOverlayのズレと追従性の改善** (2026-01-04): `requestAnimationFrame` による追従、`zoom` 計算の補正、背景ガイド画像の追加。
- **画像固定マスク方式のトリミング実装** (2026-01-04): 画像が縮小してしまう問題を解決。背景と枠内画像を同期させ、枠だけを動かす方式に変更。
- **ImageCropOverlayのスタイル同期とmaxWidth対策** (2026-01-04): Tailwind CSSの `img { max-width: 100%; }` リセットの影響で枠内画像が縮小していた問題を `maxWidth: 'none'` で解消。border/paddingの同期と合わせて位置ズレを完封。
- **Store拡張とアスペクト比固定実装** (2026-01-04): `imageCropAspectRatio` をStoreに追加し、1:1選択時に元画像を変形させずにオーバーレイの枠のみを正方形にするよう修正。
- **トリミング適用ロジックの強化** (2026-01-04): `target.setAttribute` を用いた明示的なスタイル属性更新と、Store反映待ち時間の確保（setTimeout 300ms）により、適用漏れを防止。
- **トリミング後のサイズ・位置反映の実装** (2026-01-04): `handleApply` において、`object-position` だけでなく要素の `width`, `height`, `transform` も更新するように修正。
- **トリミング適用ロジックの抜本的刷新（第4弾・ズーム解放版）** (2026-01-04): 
    - **背景画像方式への移行**: `object-fit: cover` では「画像サイズがコンテナサイズを下回れない」という仕様上の制約があり、拡大トリミング（ズーム）が制限されていた。これを解消するため、トリミング適用時に `img` を `div` へ変換し、`background-image` / `size` / `position` による制御へ変更。
    - **ズームの完全自由化**: `background-size` をコンテナ比で計算（例: 400%など）することで、元画像の任意の狭い範囲を拡大して表示することが可能になった。
- **トリミング再編集時の「リセット」仕様の実装** (2026-01-04): 
    - **逆算復元ロジック**: 現在の `background-size` と `background-position` から、現在の縮尺における「元画像全体の論理サイズ」と「現在の表示位置」を逆算。
    - **オーバーレイの初期化**: 逆算された「フル画像」をオーバーレイのベースとし、`cropRect` を全体を覆うように初期化することで、前回のトリミングに縛られず全貌から選び直せる「リセット」を実現。
- **トリミング精度を物理的に「ゼロ」へ（絶対ピクセル制御）** (2026-01-04): 
    - **%指定の廃止**: `background-position: X%` はコンテナサイズに依存し、誤差が出やすいため、`background-position: -Xpx` の絶対値指定に切り替え。
    - **背景サイズのpx固定**: `background-size` も `%` ではなく計算済みの `px` で指定。
    - **計算式の単純化**: `Ratio = NW / CW` などの相対計算を廃止し、すべてを「論理スケール」に基づいた絶対ピクセルマッピングに統合することで、誤差が発生する余地を排除。

- **トリミング時のジャンプ現象修正と画質向上** (2026-01-04):
    - `useMoveable` をトリミング中一時的に無効化し、スタイル競合を排除。
    - `handleApply` 中にターゲットを一時的に隠し、座標確定後に表示・同期することでジャンプを防止。
    - `index.css` への `image-rendering` 設定と `Math.round` による座標整数化で、サブピクセルレンダリングによるボケ（画質低下感）を解消。
    - Tailwind の `max-width: 100%` 干渉を `!important` で完封。



## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- **角の丸み**: `RadiusPicker.tsx` ですでにスライダーが実装されているため、`FloatingMenu.tsx` で画像に対してもこのコンポーネントを使用するように変更。
- **リサイズポイント**: 画像要素の `renderDirections` を四隅（`nw, ne, sw, se`）のみに制限することで、縦横比を維持しない不自然な変形を防止。
- **トリミング**: `ImagePositionPanel.tsx` を `ImageSaveWizard.tsx` のような比率選択 UI に。`object-position` のスライダーは直感的でないため廃止。
- **画像トリミングの実装方法**: 画像要素のトリミングは `object-fit: cover` + `object-position` でCSSレベルで実現。トリミング枠の相対位置からパーセントを算出。
- **操作性**: フローティングメニューで「画像上でトリミング」を押すと、その他の要素が減光（backdrop-blur）し、対象画像のみが強調されるモードに入ることでミス操作を防ぐ。
- **同期**: `Portal` 内での変更を `CustomEvent('canvas-update')` を通じて `useMoveable` に伝え、自動保存（`updateContentFromDOM`）をトリガーしている。
- **object-fit: cover の限界**: `object-fit: cover` は「コンテナを埋める最小のスケール」を自動計算する便利な機能だが、それ以上のズーム（拡大）を `object-position` だけで制御することはできない。コンテナとクロップのアスペクト比が一致する場合、`cover` は常に画像全体を表示しようとする。
- **background-image による解決**: `background-size` をパーセント（100%超）で指定することで、`cover` の制約を超えた任意の拡大率を実現できる。
- **要素の置換とReactの整合性**: DOM上で `img` を `div` に置換しても、`CustomEvent('canvas-update')` を発火させることで React 側の State（HTML文字列）が同期され、一貫性が保たれる。
- **座標系の不変性**: クロップ範囲の計算は「元画像の解像度（Natural Size）」を不変の基準点として扱うことで、何度トリミングを繰り返しても劣化やズレが発生しない。
- **2%の拡大ズレの数学的解決**:
    - `%` 指定は `(Image - Container) * Pct` という計算になるが、絶対ピクセル指定なら `X = -CropX` で完結する。
    - 計算式を `Ratio = NW / CW` ではなく、全プロセスを「論理スケール」に基づいた絶対座標（Logical Pixels）に統合。
- **リセット仕様の完全準拠**: 初回・再実行を問わず、常に元画像の全貌を (0,0,fullW,fullH) としてオーバーレイを開始することで、ユーザーが「どこからでも選び直せる」体験を保証。
    - 前回のトリミング済み `div` の `background-size (%)` と `width` から、現在のスケール `s` を `s = (sizeW% / 100) * width / naturalWidth` として特定できる。
    - この `s` を用いて、オーバーレイ上に `naturalWidth * s` の「全貌」を描画し、現在の位置を `background-position` から差し戻すことで、元画像全体を基準とした新しいトリミング指定が可能になる。



## 4. 解決済み要件とその解決方法
- **角の丸みスライダー対応**: `FloatingMenu.tsx` で画像要素に対しても `RadiusPicker` を表示するように変更し、スライダーで連続的な調整を可能にした。
- **リサイズハンドルの制限**: `useSelection.ts` で画像要素を判定し、リサイズハンドルを四隅（nw, ne, sw, se）のみに制限した。
- **トリミング適用ロジックの改善 (同期と反映)**: `handleApply` において、`object-position` だけでなく要素の `width`, `height`, `transform` も更新するように修正し、スタイル属性を確実に同期させることでトリミングを反映。
- **トリミング精度とズーム問題の解消 (background-image 方式)**: `object-fit: cover` の制約を回避するため、適用時に要素を `div` へ変換し `background-image` / `size` / `position` による精密制御に移行。これにより、拡大トリミング（ズーム）時でも 1px の狂いもない完全な再現性を確保。
- **1:1アスペクト比固定**: `imageCropAspectRatio` をStoreに実装し、初期化時にアスペクト比を計算して枠だけを変形させるロジックに変更し、1:1の比率を維持したままの調整を可能にした。
- **画像メニューのトリミング有効化**: 比率は free と 1:1 をサポートし、直感的な操作が可能な UI を実装。
- **適用時のジャンプ現象修正**: トリミング適用プロセス中に一時的に要素を隠し（opacity 0）、Moveableを無効化することで、スタイル同期中の「左上へのジャンプ」を視覚的に解消。
- **トリミング再編集時のリセット機能**: トリミング済みの画像に対して再度トリミングを行う際、前回の設定を破棄し、元画像全体から範囲を選択し直せるように復元ロジックを実装。
- **画質とレンダリング品質の向上**: `image-rendering: -webkit-optimize-contrast` の導入と座標の `Math.round` 処理により、ボケやサブピクセルによる画質低下を抑制。





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
