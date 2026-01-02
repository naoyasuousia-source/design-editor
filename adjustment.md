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

### 2026-01-03 00:55 - ホバー枠の排他表示（親子同時表示の防止）

**目的**: 非選択時に親子要素が同時にホバー枠を表示してしまう問題を解消し、選択時のみ「既存の選択枠」と「新規のホバー枠」が共存する挙動を実現する。

**変更内容**:
1. `src/styles/index.css`
   - ホバーのCSSセレクターに `:not(:has(*:hover))` を追加。
   - これにより、マウスが乗っている要素のうち「さらに内側にマウスが乗っている要素（子要素）を持たない」要素、つまり最前面の要素のみに枠が表示されるようになる。
   - 一方で `.moveable-target-active`（選択中要素）に対しては無条件で枠を表示し続けるため、選択枠と別の要素のホバー枠の共存は維持される。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### CSS :has() による深度判定
- 以前の単純な `*:hover` はバブリングによって全親要素に適用されていたが、`:has(*:hover)` で反転判定を行うことで、純粋に「ターゲットされている1要素」のみをCSSで特定できるようになった。

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
- 四隅では、今まで通り、フォントサイズをレスポンシブさせながら、テキストボックスを拡大縮小する。
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
<remarks>CSSとHookのライフサイクル調整により、編集とUI表示の共存を実現。</remarks>
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
<remarks>CSSの :has(*:hover) を用いて、ホバー対象を最前面の1要素に限定。選択枠（active）とは独立して機能するように。 </remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/styles/index.css - ホバーの排他制御ロジック（:has()）の追加
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### 深度を考慮したホバー検知
1. **Exclusive Hover**: `:not(:has(*:hover))` という疑わしい子要素を排除するセレクタにより、ツリー構造の最も末端にあるホバー要素のみを選択。
2. **Selection Dominance**: `.moveable-target-active` による枠表示はホバー判定とは独立しているため、「選択中の枠」と「現在ホバーしている別の要素の枠」が重ならずに共存可能。
