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
<content>- 現在カラーメニューがフォントメニューの下に展開され、テキストを覆い隠してしまうので、フォントメニューの上に展開するようにする。
- また、カラーメニューは、現在カラーをクリックするまで開かないようにする。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>フォントサイズ変更ドロップダウンが、現在白背景に白文字で、数字が見えないので修正する。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>
- テキストボックス選択時のメニューは、なにかを変更しても自動で閉じず、連続変更可能にする。（他の要素が選択されたら消す）</content>
<current-situation>フォントファミリー、フォントサイズは一回変えるとメニューが画面の左上に移動してしまう。フォントカラーは一回目は変えても移動しないが、連続変更するとメニューが左上に移動してしまう。</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>- フォントサイズ変更は、現在のフォントサイズが書かれた入力ボックスと、その右に矢印を配置。入力ボックスでは直接入力可能。右の矢印を押すとドロップダウンで選択可能。</content>
<current-situation>現在はフォントサイズが二か所表示されているので、ひとつにする。</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>
- フォントカラーは、メニュー上では、現在のカラーのみを表示。そのカラーをクリックするとカラーメニューが開く。
- カラーメニューでは、スポイトと30色程度のカラーパレットが表示される。（自動で閉じず連続変更も可能）
</content>
<current-situation></current-situation>
<remarks>アップ画像みて</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026-01-03: `FloatingMenu.tsx` の機能拡張とバグ修正
    - メニューが画面左上にジャンプするバグを修正（`useMoveable.ts` で DOM 再描画時に ID を用いた要素再取得ロジックを追加）。
    - フォントサイズ UI を「入力ボックス + 矢印ドロップダウン」の統合形式に変更。
    - フォントカラー/ボーダーカラー UI を「現在の色表示 + クリックでパレット展開」に変更。
    - 指定画像に基づいた 28 色のカラーパレットを実装。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `dangerouslySetInnerHTML` を使用しているため、コンテンツ更新時に DOM 要素そのものが置換される。そのため、`useMoveable` が保持している以前の DOM 要素参照が無効（disconnected）になり、メニューが座標 (0,0) を参照して左上に飛んでいた。
- 要素に一意の ID が付与されていれば、再描画後も `querySelector` で追跡可能であることが確認された。
- フォントサイズの直接入力とドロップダウンの競合を防ぐため、`select` 要素を透明にしてアイコンに重ねる手法を採用。



## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/components/features/FloatingMenu.tsx`: 要素選択時に表示される共通編集メニュー。
- `src/components/features/Workspace.tsx`: キャンバス描画と Moveable、FloatingMenu の統合。
- `src/hooks/useMoveable.ts`: 要素の選択、移動、リサイズ、テキスト編集状態の管理。
- `src/constants/editor.ts`: フォントリストや定数の定義。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **UI コンポーネント**: `lucide-react` (アイコン), `Tailwind CSS` (スタイリング)。
- **操作ツール**: `react-moveable` (要素の GUI 操作)。
- **カラー選択**: ブラウザ標準の EyeDropper API とカスタムパレット（28色）。
- **DOM 追跡**: `useMoveable.ts` 内の `useEffect` による `id` ベースの再同期（コンテンツ更新後のメニュー位置維持のため）。
- **フォントサイズ UI**: 隠し `select` と `ChevronDown` アイコンを組み合わせたカスタムコンポーネント。
- **データ管理**: ストアへの同期は `onUpdate` (Workspace 経由で `updateContentFromDOM`) を通じて行われる。
- **ID コピー**: `navigator.clipboard` API を使用。
