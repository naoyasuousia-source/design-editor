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
- テキストの拡大縮小ロジックを大幅改善する。
- テキストボックスのパディングは常に0にする。
- 拡大縮小ポイントは、四隅と、左右のみとし、上下は廃止する。
- 四隅では、今まで通り、フォントサイズをレスポンシブさせながら、テキストボックスを拡大縮小する。
- 左右ポイントではフォントサイズは絶対に変えない。
- 左右ポイントでは、テキストボックスの横幅を狭くすると、テキストを折り返して全テキストを表示する。
- 横幅を広くすると、折り返しを解除していき、最終的に一行にする。
**テキストボックス以外の仕様は一切変更しないこと**
**子要素は親要素を絶対にはみ出さないという制約を優先する。**</content>
<current-situation>現在、テキストのパディングが存在し、テキストの純粋な縦幅と、テキストボックスの縦幅が異なってしまっている。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 2026-01-02 23:55 - 操作ポイントと要素外枠の不一致（ズレ）の解消

**目的**: ズーム倍率を変更した際に、Moveableの操作ポイントが要素の実際の境界とズレる問題を修正する。

**変更内容**:
1. `src/components/features/Workspace.tsx`
   - ズームの実装を、コンテナの `width/height` 直接書き換えから、CSSの `transform: scale(zoom)` によるスケーリングに変更。
   - `Moveable` をスケーリングされたコンテナ内に配置し、座標系を論理座標（デザイン上のpx）に統一。
   - `Moveable` に `zoom={1 / zoom}` プロパティを渡し、ハンドルの見た目の大きさを一定に保つよう改善。
   - スケーリングされたキャンバスを、実際の表示サイズ（物理px）を持つラッパーで包むことで、中央寄せとスクロールの挙動を安定化。
2. `src/hooks/useMoveable.ts`
   - `getBounds`: 物理座標（`getBoundingClientRect`）から論理座標への変換時に `zoom` で除算するように修正。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### 座標系の統一
- 以前は `zoom` 倍率をコンテナの `width/height` に直接掛けていたため、中身の `absolute` 要素（倍率が掛かっていない）との間で座標の不一致が起きていた。
- `transform: scale` を使用し、且つ `Moveable` をその内側に入れることで、`Moveable` が扱う全てのpx値が「デザイン上の論理px」として処理されるようになり、正確な位置合わせが可能になった。

## 4. 解決済み要件とその解決方法

<requirement>
<content>親要素内のテキストボックスをクリック場合、親要素を選択するのではなく、テキストボックスそのものを直接選択するようにする。</content>
<current-situation>解決済み</current-situation>
<remarks>handleCanvasClick のロジック修正により解決。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>子要素は親要素から絶対にはみ出さないようにする。</content>
<current-situation>解決済み</current-situation>
<remarks>getBounds による制限を実装。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>子要素を持つ要素は、要素自体の縦横伸長、比率固定での拡大縮小、子要素をすべてレスポンシブさせる比率固定での拡大縮小の3パターンにする。</content>
<current-situation>解決済み</current-situation>
<remarks>keepRatio の動的切り替えと比例スケーリングを実装。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>拡大縮小ポイントと、要素の外枠が一致してない。</content>
<current-situation>ズーム時に座標系がズレていた。</current-situation>
<remarks>ズーム実装を transform: scale に刷新し、座標系を論理pxに統一したことで解決。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/components/features/Workspace.tsx - デザイン領域（ズーム、スケーリング、Moveableの統合）
src/hooks/useMoveable.ts       - GUI編集ロジック（座標計算、Bounds、選択管理）
src/store/useEditorStore.ts    - 状態管理（zoom, targets, content 等）
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### スケーリング・座標同期
1. **Viewport**: スケーリング後の物理サイズ (`logicalWidth * zoom`) を持ち、中央寄せを担当。
2. **Scale Container**: `transform: scale(zoom)` を持ち、内部の座標空間を常に「論理デザインpx」に保つ。
3. **Moveable Integration**: スケールコンテナ内に配置することで、`width`, `height`, `left`, `top` などの値をスケーリングを気にせず論理値として操作。
