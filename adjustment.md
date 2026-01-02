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

### 2026-01-02 10:30 - 親要素内での移動制限（Bounds）の実装

**目的**: 子要素が親要素からはみ出さないように制限をかける。

**変更内容**:
1. `src/hooks/useMoveable.ts`
   - `getBounds`: 選択要素の親要素の矩形を取得し、キャンバス相対座標に変換して返す関数を追加。
2. `src/components/features/Workspace.tsx`
   - `Moveable` コンポーネントに `bounds` プロパティを適用。
   - `container` を `canvasRef.current` に設定し、座標系を統一。

### 2026-01-02 10:45 - 3パターンのリサイズ挙動とレスポンシブ縮尺の実装

**目的**: 角での比率固定リサイズ、辺での自由リサイズ、および子要素を連動させるレスポンシブ機能の追加。

**変更内容**:
1. `src/store/useEditorStore.ts` / `src/types/editor.ts`
   - `isResponsiveResize` 状態を追加。
2. `src/components/features/FloatingMenu.tsx`
   - レスポンシブモードの切り替えボタン（Maximizeアイコン）を追加。
3. `src/hooks/useMoveable.ts`
   - `handleResizeStart`: リサイズ開始時にドラッグの方向（角か辺か）を判定し、`keepRatio` 状態を動的に切り替えるロジックを実装。
4. `src/components/features/Workspace.tsx`
   - `onResize`: `isResponsiveResize` が有効な場合、親のリサイズ率に合わせて子要素の `width`, `height`, `left`, `top`, `fontSize` を比例計算で更新する処理を追加。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### レスポンシブスケーリングの計算
- 子要素が `position: absolute` でない場合（Flexbox等）でも、`offsetWidth` 等から初期値を取得してインラインスタイルで `px` 指定を上書きすることで、強制的にスケーリングさせる手法をとった。
- `fontSize` のスケーリングは、縦横の平均比率を使用することで、歪みを最小限に抑えている。

### Bounds の座標系
- `Moveable` の `container` を `canvasRef.current` に設定することで、`useMoveable` で計算したキャンバス相対座標と一致させ、正確な境界制限を実現した。

## 4. 解決済み要件とその解決方法

<requirement>
<content>親要素内のテキストボックスをクリック場合、親要素を選択するのではなく、テキストボックスそのものを直接選択するようにする。</content>
<current-situation>現在は、親要素内のテキストボックスをクリックすると、親要素が選択され、親要素の拡大縮小ポイントが表示される。</current-situation>
<remarks>handleCanvasClick のロジックを修正し、ターゲット要素を直接 targets に設定するようにした。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>子要素は親要素から絶対にはみ出さないようにする。</content>
<current-situation>現状は、子要素を親要素の外に出せてしまい、親子関係があいまいになってしまう状態。</current-situation>
<remarks>getBounds() による動的な境界制限を実装。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>子要素を持つ要素は、要素自体の縦横伸長、比率固定での拡大縮小、子要素をすべてレスポンシブさせる比率固定での拡大縮小の3パターンにする。</content>
<current-situation>角を選択した場合は常に比率固定、辺を選択した場合は自由、さらにUIからレスポンシブ連動を選択可能にした。</current-situation>
<remarks>keepRatio の動的切り替えと、子要素の比例計算スケーリングを実装。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/hooks/useMoveable.ts       - GUI編集フック（要素選択、ドラッグ操作、Bounds計算、比率固定制御）
src/components/features/Workspace.tsx - デザイン領域表示コンポーネント（Moveable連携、レスポンシブスケーリング実行）
src/store/useEditorStore.ts    - グローバル状態管理（content, isResponsiveResize 等）
src/components/features/FloatingMenu.tsx - 操作メニュー（レスポンシブモードのトグルUI）
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### レスポンシブ拡大縮小の仕組み
- `onResize` イベントで親要素の `width/height` の変化率（ratioW, ratioH）を算出。
- 全ての子要素に対し、その変化率を `left`, `top`, `width`, `height` に乗算して即時反映。
- `fontSize` は縦横の平均変化率を適用。

### 境界制限（Bounds）の仕組み
- `react-moveable` の `bounds` プロパティに対し、親要素（`parentElement`）の矩形をキャンバス相対座標で供給。
- `container` をキャンバスと一致させることで、描画と制限の座標系を同期。
