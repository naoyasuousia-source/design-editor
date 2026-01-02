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
<content>テキストボックスのパディングがUI上で0になっていないので原因を突き止めて修正する。</content>
<current-situation>親要素の四角枠は操作枠と実際の外枠が一致している。</current-situation>
<remarks>アップ画像みて</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 2026-01-03 00:25 - テキストボックスのリサイズ挙動の刷新

**目的**: テキストボックスの編集性を高めるため、パディングの排除、ハンドルの制限、および「角：拡大縮小」「左右：横幅変更・折り返し」の撃ち分けを実装する。

**変更内容**:
1. `src/hooks/useMoveable.ts`
   - `isTextBox`: 要素が単一のテキスト要素（子要素を持たないdiv等）かどうかを判定するロジックを追加。
   - `getRenderDirections`: ターゲットがテキストボックスの場合、上下のハンドルを非表示にし、四隅と左右のみを表示するよう制御。
2. `src/components/features/Workspace.tsx`
   - `onResize`:
     - テキストボックスの場合、常に `padding: 0` を強制適用。
     - **左右ハンドル（辺）の操作**: フォントサイズを維持。横幅（`width`）のみ変更し、高さ（`height`）は `scrollHeight` を用いてテキストの折り返しに合わせて自動調整。
     - **角ハンドルの操作**: フォントサイズをリサイズ率に合わせてスケーリング。その後、高さを中身に合わせて再調整。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### テキストの折り返しと高さの同期
- Moveableで `width` を変えた直後、スタイルを `height: auto` に設定して `scrollHeight` を取得することで、ブラウザの自然な折り返し挙動に合わせた正確なボックス高さを即座に反映できる。
- `isTextBox` の判定を厳密にすることで、画像やコンテナ要素（子要素あり）に対しては従来の「自由リサイズ」や「レスポンス連動」を維持し、ユーザーの混乱を防いでいる。

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
<remarks>方向に応じた撃ち分け（フォントスケール vs 横幅ラップ）を実装。上下ハンドルを排除。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/hooks/useMoveable.ts       - テキストボックス判定とハンドル方向制御
src/components/features/Workspace.tsx - 状況（テキスト/非テキスト、角/辺）に応じた個別リサイズロジック実行
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### テキストリサイズ・ダイナミクス
1. **Handle Filtering**: `renderDirections` により上下ハンドル (`n`, `s`) を排除し、ユーザーに「横幅変更」であることを視覚的に提示。
2. **Auto-height wrap**: `width` 変更直後に HTML 要素の `height` を `auto` にリセットし、`scrollHeight` を読み取って即時反映することで、テキストが常に全表示されるよう制御。
3. **Pure Textbox Enforcing**: リサイズイベントの度、または編集確定時に `padding: 0` を再適用することで、デザインの不整合（枠と文字の乖離）を防止。
