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
<content>- </content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 2026-01-03 01:05 - 親要素縮小制限の抜本的改善（子要素の完全固定化）

**目的**: 親要素の幅を縮める際に、子要素がレスポンシブ挙動（%指定等）によって勝手に縮小・折り返しされるのを防ぎ、子要素の「本来のサイズ」を維持したまま親の縮小限界として機能させる。

**変更内容**:
1. `src/hooks/useMoveable.ts` & `src/components/features/Workspace.tsx`
   - `onResizeStart` / `onResizeGroupStart` において、`isResponsiveResize`（レスポンシブモード）がオフの場合、全子要素のスタイル（`left`, `top`, `width`, `height`, `fontSize`）を、その瞬間の `px` 値で上書き固定する処理を追加。
   - 固定した子要素の占有範囲から、親要素が維持すべき最小サイズ（`data-min-w`, `data-min-h`）を算出し、ターゲットに記録。
2. `src/components/features/Workspace.tsx`
   - `onResize` において、上記で記録された最小サイズを絶対的なしきい値として使用し、リサイズを制限。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### リアルタイム計算の罠
- リサイズ中に毎回 `offsetLeft` 等を計算すると、親の縮小に伴って子要素（%指定等）も縮んでしまい、計算上の最小サイズも連動して小さくなってしまう「追いかけっこ」状態が発生していた。
- リサイズ開始時に「スナップショット」を撮り、かつ子要素を `px` 指に一時変換（固定化）することで、物理的な「壁」としての挙動を完璧に実現できた。

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
<remarks>CSSとHookの調整により実現。</remarks>
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
<remarks>CSSの :has(*:hover) を採用。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>
- 親要素の縮小制限、高さ方向は完璧だが、横方向は要改善である。
- 親要素の幅の縮小時、子要素は絶対にレスポンシブさせず、幅を縮めない。
- そのうえで、子要素全体の幅を親要素縮小の制限とする。</content>
<current-situation>解決済み</current-situation>
<remarks>リサイズ開始時に子要素のスタイルをpxで強制固定化し、物理的な限界サイズをスナップショットとして使用することで解決。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/hooks/useMoveable.ts - 単一選択時の子要素固定化と最小サイズ記録
src/components/features/Workspace.tsx - グループ選択時の子要素固定化と、全リサイズ時おけるスナップショットベースの制限適用
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### 非レスポンシブ・リサイズにおける子要素の「凍結」
1. **Style Freezing**: `onResizeStart` 時に全子要素の `offsetLeft`, `offsetWidth` 等を読み取り、`style.left`, `style.width` 等に `px` 値として書き込む。これにより、親の `width` が変化しても CSS の再計算（%計算）による子要素の変形が発生しなくなる。
2. **Snapshot Limit**: 子要素の配置から「絶対に必要な親の最小幅・高」をリサイズ開始の瞬間に1度だけ算出し、ターゲットに保持。
3. **Impenetrable Boundary**: リサイズイベント中、Moveable からの入力値をこの保持された最小値と比較し、絶対にそれを下回らないよう制御することで、子要素を一切圧縮・折り返しさせない強固な構造維持を実現。
