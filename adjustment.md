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
- **目的**: デフォルト枠線カラーの変更、選択時のレイヤー順序維持、および外部クリックによる選択解除機能の追加。
- **変更内容**:
    - `src/components/features/floating-menu/FloatingMenu.tsx`: 枠線トグル時のデフォルトカラーを `#ffffff` から `#000000` に変更。
    - `src/styles/index.css`: `.moveable-target-active` に適用されていた `z-index: 9999 !important` をコメントアウト。
    - `src/store/useEditorStore.ts`: グローバルな選択解除リクエスト用のステート `isDeselectTriggered` とアクションを追加。
    - `src/hooks/moveable/useSelection.ts`: store のリクエストを監視して `selectNone()` を実行する Effect を追加。
    - `src/components/features/workspace/Workspace.tsx`: 背景領域クリック時に `triggerDeselect()` を呼び出すように変更。
    - `src/components/common/Navbar.tsx`: メニューバーの余白クリック時に `triggerDeselect()` を呼び出すように変更。
    - `src/hooks/moveable/useSelection.ts`: `selectNone` 等の定義位置を修正し、初期化順序エラー（ReferenceError: Cannot access 'selectNone' before initialization）を解消。
    - `src/types/editor.ts`, `src/store/useEditorStore.ts`: `isDeselectTriggered` プロパティの型定義不足によるビルドエラーを修正。これにより GitHub デプロイワークフローのエラーを解消。
- **変更日時**: 2026-01-05 18:25 (JST)

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- **要件1（枠線カラー）について**: `FloatingMenu.tsx` 内で、枠線がオフからオンに切り替わる際に `#ffffff` がハードコードされている箇所を発見。これを `#000000` に変更することで解決可能。
- **要件2（レイヤー順序）について**: `index.css` の `.moveable-target-active` に対して `z-index: 9999 !important` が設定されているため、選択時に最前面に表示されてしまっている。これを削除することで、本来のレイヤー構造に従ったレンダリングを維持できる。ただし、背後の要素を直接クリックで選択しにくくなる可能性があるが、レイヤーパネルからの選択や、handlesの操作は可能。
- **新規要件（選択解除）について**: エディタ外の領域をクリックした際に選択を解除するため、Zustand store を介したメッセージング方式を採用。これにより `Workspace` や `Navbar` など、`useMoveable` フックの外にいるコンポーネントからも安全に選択解除を要求できる。

## 4. 解決済み要件とその解決方法
<requirement>
<content>画像と図形の枠線をonにした場合のデフォルト枠線カラーは黒にして！</content>
<current-situation>解決済み</current-situation>
<remarks>FloatingMenu.tsx でのデフォルト値を #000000 に変更。</remarks>
</requirement>

<requirement>
<content>重なっている要素のうち、下層の要素を選択した場合、編集、ドラッグ移動は可能だが、レンダリングはレイヤー構造通りにする。</content>
<current-situation>解決済み</current-situation>
<remarks>index.css での .moveable-target-active の z-index 引き上げを削除。</remarks>
</requirement>

<requirement>
<content>デザイン領域の外の黒い背景やメニューバーの余白部分を押した場合、要素選択状態をリセットする仕様にする。</content>
<current-situation>解決済み</current-situation>
<remarks>Zustand store を介して Workspace や Navbar から選択解除をトリガーする仕組みを導入。</remarks>
</requirement>

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/components/features/floating-menu/FloatingMenu.tsx`: 要素選択時のツールバー。枠線カラーのデフォルト値を保持。
- `src/styles/index.css`: アプリ全体のグローバルスタイル。選択中要素の z-index 制御。
- `src/components/features/workspace/DesignArea.tsx`: 要素のレンダリング（dangerouslySetInnerHTML）を担当。
- `src/components/features/workspace/Workspace.tsx`: ワークスペースのコンテナ。背景領域のクリック検知。
- `src/components/common/Navbar.tsx`: 上部ナビゲーションバー。余白部分のクリック検知。
- `src/store/useEditorStore.ts`: エディタ全体のステート管理。選択解除のイベント発火を担当。
- `src/hooks/moveable/useSelection.ts`: DOM 要素の選択状態を管理するフック。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **react-moveable**: 要素のドラッグ、リサイズ、回転を実現するライブラリ。
- **Tailwind CSS**: UI スタイリング。
- **Zustand (useEditorStore)**: エディタ全体のステート管理。
- **動作原理**: `DesignArea` で HTML を一括レンダリングし、その上のレイヤーで `react-moveable` の制御用要素（handles 等）を表示している。特定の要素を選択すると `.moveable-target-active` クラスが付与され、現在は CSS で z-index が引き上げられている。
