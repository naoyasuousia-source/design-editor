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


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026-01-03: `FloatingMenu.tsx` の UI 配置改善と詳細調整
    - メニューを要素の上方向に展開するように変更（`bottom` アンカーを使用）。
    - カラーパレット等のサブパネルをメインメニューより上に配置し、操作対象を覆い隠さないように改善。
    - フォントサイズ/フォントファミリーのドロップダウンの背景色と文字色を修正し、視認性を向上。
    - フォントサイズドロップダウン内の数字のフォントサイズを縮小（0.8倍相当）。
    - 連続変更時もメニューが閉じないように各種イベントハンドラを最適化。


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- メニューの `top` を固定すると高さが増した時に下方向に伸びて要素を隠してしまうため、`bottom` を固定することで上方向に伸びるように変更した。
- `select` 要素の `option` タグはブラウザのネイティブ実装に依存するため、インラインスタイルや Tailwind だけでなく、OS/ブラウザの規定に従いやすい明示的な背景色指定が必要。
- フォントサイズの変更イベント `onChange` において、`applyStyle` を呼び出した後の状態遷移を抑制することで連続変更を可能にした。
- メニューの ID 再同期（`useMoveable.ts`）により、要素の置換後も座標計算が継続されるようになった。



## 4. 解決済み要件とその解決方法
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
