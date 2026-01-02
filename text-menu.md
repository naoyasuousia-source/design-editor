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
-テキストボックスではない図形要素のメニューは内部カラー、枠線onoff、枠線カラー、かどの丸み、子要素レスポンシブonoff（青くすると子要素もレスポンシブで拡大縮小できる機能）、deleteのみとする。
- ほかのメニューは消すこと！
（トリミング、画像差し替えは、画像のメニューのみに表示）</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>角の丸みはスライダーで連続的に変えれるようにする。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>子要素レスポンシブ状態での拡大縮小は、完全にレイアウトを保ったまま行うようにする。</content>
<current-situation>現在は、テキストボックスとの位置関係等が乱れてしまう。できれば親子の位置関係と比率を完全に維持したい。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026-01-03: `FloatingMenu.tsx` の図形要素（Shape）対応
    - テキスト、画像、図形を厳密に判定するロジックを導入。
    - 図形要素専用メニュー（内部カラー、枠線トグル、枠線カラー、角丸、子要素レスポンシブ）を実装。
    - 不要なメニュー（フォント設定、トリミング、画像差し替え）を各要素タイプに応じて非表示化。
    - メニューを要素の上方向に展開するように変更（`bottom` アンカーを使用）。
    - 視認性向上のためカスタムドロップダウン（10px）と背景色固定を実装。


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- 要素の判定基準を整理（`img` タグ or 背景画像なら画像、テキストコンテンツがあればテキスト、それ以外を図形）。
- ネイティブの `select` 要素は選択後に必ず閉じてしまうため、`div` 等を組み合わせたカスタムドロップダウンを構築。
- `showBgPalette` などのステートを追加し、図形要素の「内部カラー」を個別に管理。
- メニューの ID 再同期（`useMoveable.ts`）により、要素の置換後も座標計算が継続されるようになった。



## 4. 解決済み要件とその解決方法
- **メニューの上展開とカラーパレット制御**: `bottom` 基準の座標計算に変更し、サブメニューをメインメニューの上に表示。カラーパレットはクリック時のみ開くように改善。
- **視認性向上とドロップダウンカスタム化**: ネイティブ `select` を廃止し、背景（黒）・文字（白10px）を固定したカスタムドロップダウンを実装。連続変更に対応。
- **メニューの連続変更とバグ修正**: `useMoveable.ts` にて `id` をキーとした再同期処理を実装し、DOM 置換後もメニューが要素を追従するように改善。
- **フォントサイズ UI 統合**: テキスト入力とプリセット選択ドロップダウン（隠し `select` + アイコン）を一つのコンポーネントに統合。
- **カラーパレット実装**: EyeDropper API と 28 色のカスタムパレットを持つサブメニューを実装。現在の色をクリックすることで展開。



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
