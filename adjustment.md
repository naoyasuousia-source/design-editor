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
- 親要素の縮小制限、高さ方向は完璧だが、横方向は要改善である。
- 親要素の幅の縮小時、子要素は絶対にレスポンシブさせず、幅を縮めない。
- そのうえで、子要素全体の幅を親要素縮小の制限とする。</content>
<current-situation>現在は、子要素が勝手に折り返されてしまう。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 2026-01-03 01:00 - 親要素の縮小制限（子要素のはみ出し防止）の実装

**目的**: 親要素を縮小する際に、中に含まれる子要素が外にはみ出さないよう、子要素の占有領域を最小サイズ（Minimum Size）として制限する。

**変更内容**:
1. `src/components/features/Workspace.tsx`
   - `onResize` および `onResizeGroup` において、`isResponsiveResize`（レスポンシブ縮小）がオフの場合の縮小制限を追加。
   - リサイズ対象要素の全子要素を走査し、親要素の左上からの最大右端（`left + width`）と最大下端（`top + height`）を計算。
   - 計算された値を `minW`, `minH` とし、Moveableから渡される新しい `width`, `height` がこれらを下回らないよう `Math.max` でクリップ。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### 制限の適用条件
- 「子要素をレスポンシブさせる（比率固定）」モードが有効な場合は、親の縮小に合わせて子要素も同様に縮小されるため、このハード制限は適用しない（適用すると親の自由なリサイズを妨げるため）。
- 通常の「引き伸ばし」リサイズにおいて、子要素を「押しつぶしたり」「隠したり」することを防ぐためのガードレールとして機能する。

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
<current-situation>解決済み</current-situation>
<remarks>ズーム実装を transform: scale に刷新し解決。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>
- テキストの拡大縮小ロジックを大幅改善する。
- テキストボックスのパディングは常に0にする。
- 拡大縮小ポイントは、四隅と、左右のみとし、上下は廃止する。
- 四隅では、今まで通り、フォントサイズをレスポンシブながら、テキストボックスを拡大縮小する。
- 左右ポイントではフォントサイズは絶対に変えない。
- 左右ポイントでは、テキストボックスの横幅を狭くすると、テキストを折り返して全テキストを表示する。
- 横幅を広くすると、折り返しを解除していき、最終的に一行にする。
**テキストボックス以外の仕様は一切変更しないこと**
**子要素は親要素を絶対にはみ出さないという制約を優先する。**</content>
<current-situation>解決済み</current-situation>
<remarks>方向に応じた撃ち分けを実装。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>
- 操作枠が現在はポイントだけだが、ポイントを常に、薄い水色の線で結ぶ。
- 要素にホバーすると、ホバーした要素の水色枠が表示される。
- 要素をクリックすると、水色枠に加え、ポイントが表示される。
- また、要素中央の赤いポイントは廃止する
**ここまではテキストボックスも図形も共通**
- テキストボックスをダブルクリックすると、水色枠とポイントは表示したまま、編集モードに入る。
（現在の編集モード時の黒枠は廃止する）</content>
<current-situation>解決済み</current-situation>
<remarks>CSSとHookのライフサイクル調整により実現。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>水色枠は、要素をクリックした後も消えないようにする。（別要素が選択されたら、解除）</content>
<current-situation>解決済み</current-situation>
<remarks>activeに対してもoutlineを適用。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>- 何も要素が選択されていない場合、同時に複数要素の水色枠を絶対に表示しないようにする。（親子の場合でも）
- ある要素が選択され、水色枠&ポイントが表示されている場合、ほかの要素をホバーしたら、選択要素の水色枠&ポイントは維持したまま、ホバー要素の水色枠を表示する。
- その後、ほかの要素を選択しなおした場合は、元の選択要素の水色枠&ポイントを非表示にする。</content>
<current-situation>解決済み</current-situation>
<remarks>CSSの :has(*:hover) を用いて、ホバー対象を最前面の1要素に限定。 </remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>現在、子要素は親要素よりはみ出さないようにできているが、逆に、親要素の高さ・幅縮小する場合でも、子要素がはみ出さないようにする。（子要素全体の高さ、幅が縮小の制限となる）</content>
<current-situation>解決済み</current-situation>
<remarks>onResize時に子要素の最大座標を動的に計算し、親の最小サイズとして適用。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/components/features/Workspace.tsx - リサイズイベントにおけるサイズバリデーション（最小サイズ制限）の実装
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### 構造的整合性の維持（逆方向のガード）
1. **Dynamic Content Bounds**: 親要素のリサイズ中、リアルタイムで全 `children` の `offsetLeft + offsetWidth` および `offsetTop + offsetHeight` を取得し、それらを包含するのに必要な矩形領域を算出。
2. **Min-Size Enforcement**: Moveable から通知された `width / height` を、算出した包含領域のサイズで強制的に下限設定 (`Math.max`)。
3. **Responsive Bypass**: ただし、子要素自体も同時に縮小させる「レスポンシブ・リサイズ」が有効な場合は、拡大縮小率に基づいた整合性が保たれるため、このガードをバイパスして自由な縮小を許可。
