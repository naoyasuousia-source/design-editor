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
<content>視認性向上のため、スクロールバーの幅を二倍にし、ドラッグ中のカラーと、ドラッグ中以外のカラーを逆にして。</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>デザイン用紙がワークスペースより大きく、画面に収まらない場合は、ページの右辺と下辺にスクロールバーが現れ、デザイン用紙内でスクロール可能にする。</content>
<current-situation>依然デザイン用紙内のスクロール不可。スクロールバーも表示されない</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2026/01/04 20:20: レイヤーサイドバーのレイアウト修正
  - `LayerSidebar.tsx` を `fixed` から `relative` に変更し、z-index を調整。
  - `App.tsx` のメインエリアを flex-row にし、サイドバーとワークスペースを並列配置。
  - `Workspace.tsx` のルートを `relative flex-1` に変更し、レイアウトシフトに対応。
- 2026/01/04 20:30: スクロール機能の正常化（再修正）
  - `App.tsx` のラッパーに `flex` を追加し、`Workspace` が全高を継承するように修正。
  - `Workspace.tsx` に `h-full w-full` を明示し、`m-auto` と `my-16` でスクロールバッファを確保。
  - `index.css` のスクロールバー視認性を向上。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- レイヤーメニューを `fixed` で配置すると、基準がウィンドウ全体になるため `Navbar` (メニューバー) を覆ってしまう。`flex` コンテナ内での `relative` 配置に切り替えることで、メニューバーの下に収まり、かつ隣接するワークスペースを動的に押し出す挙動を実現した。
- `react-moveable` は通常、対象要素の本来の重なり順（z-index）を維持したまま操作ハンドルのみを最前面に表示する。そのため、要素の「ボディ」が他の要素の下にある場合、ブラウザのクリックイベントが上の要素に吸い取られてしまう。対象要素が選択されている間だけ `z-index` を引き上げることで、見かけ上の順序は変わるが、操作性は劇的に向上する。
- **スクロール機能の分析**: 現在の `items-center justify-center` 設定では、コンテンツが画面サイズを超えた際、上部と左側が画面外に押し出され、スクロールで見ることができなくなる。中心揃えを維持しつつ、溢れた分を正方向に逃がすレイアウト設計が必要。

## 4. 解決済み要件とその解決方法
- **レイヤーメニュー表示時のレイアウトシフト**: サイドバーを `fixed` から `relative` に、アプリ全体を `flex-row` に変更することで、UIが重ならず動的に位置が変わるように修正。
- **背後要素のドラッグ移動**: 選択中の要素にクラスを付与し、CSSでその `z-index` を最優先にすることで、重なり順に関わらずハンドルとボディの両方を掴めるように改善。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/app/App.tsx`: アプリ全体のレイアウト（Navbar, Sidebar, Workspace の配置）を管理。
- `src/components/features/LayerSidebar.tsx`: レイヤー一覧の表示と順序変更UIを提供。
- `src/components/features/Workspace.tsx`: デザイン編集エリアと MoveableUI のコンテナ。
- `src/styles/index.css`: Moveable のスタイル調整や、選択中要素の重なり順制御を担当。
- `src/hooks/moveable/useSelection.ts`: 要素の選択状態管理と、対象要素へのクラス付与を担当。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **レイアウト同期**: Tailwind CSS の Flexbox を使用。`LayerSidebar` がマウントされると `Workspace` (flex-1) が自動的に縮小・シフトする仕組み。
- **イベントキャプチャ**: `moveable-target-active` クラスが付与された要素の `z-index` を優先させることで、ブラウザのイベントターゲットを強制的に選択要素に合わせる仕組み。
- **状態管理**: `zustand` を使用して `isLayerSidebarOpen` や `selectedIds` を一元管理し、UI各所でリアクティブに反映。
- **スクロール制御**: フレックスコンテナ内での `margin: auto` を活用。コンテンツが小さい時は中央配置、大きい時はスクロールの始点（左上）を基準に溢れさせることで、直感的なスクロール操作を実現。
