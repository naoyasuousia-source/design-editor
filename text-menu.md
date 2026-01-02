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
- テキストボックス選択時のメニューは、なにかを変更しても自動で閉じず、連続変更可能にする。（他の要素が選択されたら消す）</content>
<current-situation>フォントファミリー、フォントサイズは一回変えるとメニューが画面の左上に移動してしまう。フォントカラーは一回目は変えても移動しないが、連続変更するとメニューが左上に移動してしまう。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>- フォントサイズ変更は、現在のフォントサイズが書かれた入力ボックスと、その右に矢印を配置。入力ボックスでは直接入力可能。右の矢印を押すとドロップダウンで選択可能。</content>
<current-situation>現在はフォントサイズが二か所表示されているので、ひとつにする。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>
- フォントカラーは、メニュー上では、現在のカラーのみを表示。そのカラーをクリックするとカラーメニューが開く。
- カラーメニューでは、スポイトと30色程度のカラーパレットが表示される。（自動で閉じず連続変更も可能）
</content>
<current-situation></current-situation>
<remarks>アップ画像みて</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026-01-03: `FloatingMenu.tsx` の要件実装
    - 要素IDの右側にコピーボタンを追加し、クリックでIDをクリップボードにコピー可能にした。
    - フォントサイズ変更を、プリセット（select）と直接入力（text input）の2パターンに変更し、ブラウザ標準の矢印を廃止した。
    - 太字切替トグルボタンを追加。
    - カラーピッカーを廃止し、10色のデフォルトパレットとスポイト（EyeDropper API）による選択に変更。画像ボーダー色も同様に統一。
    - メニュー内の各操作（スタイル適用等）でメニューが自動的に閉じないようにし、連続変更を可能にした。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- `FloatingMenu.tsx` が要素選択時のメニューの実体である。
- 現在のフォントサイズ入力は `input type="number"` を使用しており、ブラウザ標準の上下矢印が表示されてしまう。
- 現在のカラーピッカーは `input type="color"` を使用しており、ネイティブのカラーピッカー（RGBや詳細な選択）が表示されてしまうため、カスタムパレットの実装が必要。
- 要素IDのコピー機能は現在未実装。
- 太字切替機能も現在未実装。
- メニューが自動で閉じないようにするためには、画像選択や特定のアクション後の状態管理を調整する必要がある。


## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/components/features/FloatingMenu.tsx`: 要素選択時に表示される共通編集メニュー。
- `src/components/features/Workspace.tsx`: キャンバス描画と Moveable、FloatingMenu の統合。
- `src/hooks/useMoveable.ts`: 要素の選択、移動、リサイズ、テキスト編集状態の管理。
- `src/constants/editor.ts`: フォントリストや定数の定義。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **UI コンポーネント**: `lucide-react` (アイコン), `Tailwind CSS` (スタイリング)。
- **操作ツール**: `react-moveable` (要素の GUI 操作)。
- **カラー選択**: ブラウザ標準の EyeDropper API を使用。非対応ブラウザへのフォールバック（アラート）を含む。
- **データ管理**: ストアへの同期は `onUpdate` (Workspace 経由で `updateContentFromDOM`) を通じて行われる。
- **ID コピー**: `navigator.clipboard` API を使用。
