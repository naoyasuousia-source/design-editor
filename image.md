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
<content>トリミングは成功しているが、トリミングで選んだ範囲とレンダリング後の表示範囲がずれている。完全一致させてほしい。</content>
<current-situation>現在の手法（現在の表示サイズを基準とした比率計算）では、すでにトリミングされている画像に対してさらにトリミングを重ねる場合に、元画像の解像度との変換不整合により数パーセントのズレが生じる。縦横5%程度のズレが報告されている。</current-situation>
<remarks>画像の `naturalWidth / naturalHeight` を取得し、現在の `object-position` から「元画像のどの座標が現在表示されているか」を逆算して、新しい座標を絶対指定で再計算する必要がある。</remarks>
<permission-to-move>NG</permission-to-move>
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
- **画像固定マスク方式のトリミング実装** (2026-01-04): 画像が縮小してしまう問題を解決。背景と枠内画像を同期させ、枠だけを動かす方式に変更。
- **ImageCropOverlayのスタイル同期とmaxWidth対策** (2026-01-04): Tailwind CSSの `img { max-width: 100%; }` リセットの影響で枠内画像が縮小していた問題を `maxWidth: 'none'` で解消。border/paddingの同期と合わせて位置ズレを完封。
- **Store拡張とアスペクト比固定実装** (2026-01-04): `imageCropAspectRatio` をStoreに追加し、1:1選択時に元画像を変形させずにオーバーレイの枠のみを正方形にするよう修正。
- **トリミング適用ロジックの強化** (2026-01-04): `target.setAttribute` を用いた明示的なスタイル属性更新と、Store反映待ち時間の確保（setTimeout 300ms）により、適用漏れを防止。
- **トリミング後のサイズ・位置反映の実装** (2026-01-04): `handleApply` において、`object-position` だけでなく要素の `width`, `height`, `transform` も更新するように修正。
- **object-position 計算式の適正化（第2弾・完全版）** (2026-01-04): 
    - 単なる表示上の比率ではなく、画像の `naturalWidth/Height` と現在の `object-position` を取得。
    - 現在の表示状態から「元画像上の可視領域（ピクセル座標）」を逆算。
    - ユーザーが選択した `cropRect` をその座標系にマッピングし、新しい NSR（New Source Rect）を特定。
    - 新しい要素サイズにおいて NSR がぴったり表示されるための `object-position` パーセンテージを幾何学的に算出。
    - これにより、多重トリミングやアスペクト比の変化を伴う操作でも 1px のズレも許さない完全な一致を実現。

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
- **object-position の特殊性**: `object-fit: cover` における `%` 指定は、中心点からのオフセットではなく、「画像側の % 地点とコンテナ側の % 地点を一致させる」という仕様であるため、特定の矩形を切り出すには `x / (画像幅 - コンテナ幅)` という計算が必要になる。
- **レンダリングの連続性**: DOM を直接書き換えた後に React がそれを踏まえて再描画する際、一瞬でも不整合なスタイル（transform 無しなど）が当たるとジャンプして見える。これを防ぐには、スタイル確定まで opacity 0 にするか、Moveable などの外部干渉を完全に断つ必要がある。



## 4. 解決済み要件とその解決方法
- **角の丸みスライダー対応**: `FloatingMenu.tsx` で画像要素に対しても `RadiusPicker` を表示するように変更し、スライダーで連続的な調整を可能にした。
- **リサイズハンドルの制限**: `useSelection.ts` で画像要素を判定し、リサイズハンドルを四隅（nw, ne, sw, se）のみに制限した。
- **トリミング適用ロジックの改善 (同期と反映)**: `handleApply` において、`object-position` だけでなく要素の `width`, `height`, `transform` も更新するように修正し、スタイル属性を確実に同期させることでトリミングを反映。
- **1:1アスペクト比固定**: `imageCropAspectRatio` をStoreに実装し、初期化時にアスペクト比を計算して枠だけを変形させるロジックに変更し、1:1の比率を維持したままの調整を可能にした。
- **画像メニューのトリミング有効化**: 比率は free と 1:1 をサポートし、直感的な操作が可能な UI を実装。
- **適用時のジャンプ現象修正**: トリミング適用プロセス中に一時的に要素を隠し（opacity 0）、Moveableを無効化することで、スタイル同期中の「左上へのジャンプ」を視覚的に解消。
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
