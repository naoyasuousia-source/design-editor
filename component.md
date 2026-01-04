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
既存グループと、単独要素をシフトで選択してグループ化する際の挙動を修正する。
    - 既存グループは、複数要素選択メニューが表示されている間、常に既存グループ外枠のオレンジ枠のみを表示する。（新グループのオレンジ枠はこの段階では表示しない）
    - グループ化直後、新グループを選択状態にする。（新グループの外枠のオレンジ枠と、四隅ポイントが表示されていて、そのまま拡大縮小や移動が可能）
</content>
<current-situation>
- 現在は、複数要素選択メニューが表示されている間、シフト選択されてる既存グループは、ホバー時のみオレンジ枠が表示される。
- 現在、グループ化直後、新グループ選択状態にすぐならない。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>複数要素選択時、なぜか選択してないテキストボックスも含めて、いろいろなテキストの一部がドラッグ選択されてるように青くなってしまうので、複数要素選択時は、一切テキストが青くならないようにする。</content>
<current-situation>実装完了。DesignSurface全体に user-select: none を適用し、編集時のみ許可するように調整しました。</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **複数要素選択時の意図しないテキスト選択（ハイライト）の防止**
    - 目的: ドラッグ操作や複数選択時に、関係のないテキストが青くハイライトされてしまうのを防ぎ、エディタとしての操作感を向上させるため。
    - 内容:
        - `src/styles/index.css`: `.DesignSurface` に対し `user-select: none` を適用。
        - `src/styles/index.css`: `[contenteditable="true"]` に対して `user-select: text !important` を適用し、テキスト編集時のみ選択を許可するように設定。
    - 日時: 2026-01-04 12:50

- **要素・グループの複製機能のバグ修正と改善**
    - 目的: 複製ボタンが動作していなかった問題を修正し、操作性を向上させるため。
    - 内容:
        - `useFloatingMenu.ts`: 
            - `document.getElementById('DesignSurface')` を `document.querySelector('.DesignSurface')` に修正（IDではなくクラスが正しいため）。
            - 複製後に `setAutoSelectId` を呼び出し、複製された要素が自動的に選択されるように改善。
            - グループ内個別選択時の複製で `data-group-id` を保持しないように修正（単体複製扱い）。
        - `useMoveable.ts`: `autoSelectId` による自動選択時に、対象がグループIDを持っていればグループ全体を自動選択するように拡張。
    - 日時: 2026-01-04 12:45

- **要素・グループの複製機能の実装**
    - 目的: ユーザーが要素やグループを簡単に複製できるようにするため。
    - 内容:
        - `useFloatingMenu.ts`: `handleDuplicate` 関数を実装。選択された要素を `cloneNode` で複製し、IDを新規生成、座標を20pxオフセットして `DesignSurface` に追加するロジックを実装。
        - `FloatingMenu.tsx`: 下部ツールバーに複製ボタン（`Copy`アイコン）を追加。
        - `GroupActions.tsx`: グループ選択時のメニューに複製ボタンを追加。
        - `lucide-react`: `Copy` アイコンをインポート。
    - 日時: 2026-01-04 12:35

- **FloatingMenu のコンソールエラー修正**
    - 目的: `useAssets is not defined` エラーによりエディタがクラッシュする問題を解決するため。
    - 内容: リファクタリング時に誤って削除した `useAssets` フックと `lucide-react` のアイコンインポートを復元。
    - 日時: 2026-01-04 00:25

- **DesignArea への text-black 適用による文字色問題の解決**
    - 目的: `body` の `text-white` が継承され、初期テキストが白くなってしまう問題を確実に防ぐため。
    - 内容: `DesignArea.tsx` のコンテナに `text-black` クラスを追加。これにより、インラインスタイルや専用 CSS がない場合でも、エディタ上では黒文字がデフォルトとなる。
    - 日時: 2026-01-04 00:27

- **DesignSurfaceへのデフォルトテキストカラー設定**
    - 目的: `body` の `text-white` が継承されてテキストが白くなる問題を解決するため。
    - 内容:
        - `src/styles/index.css`: `.DesignSurface { color: #000000; }` を追加し、DesignSurface内のデフォルトテキストカラーを黒に設定。
        - `src/hooks/useElementInsertion.ts`: `color: #000000 !important` の `!important` を削除（HTMLのstyle属性では `!important` が効かないため無意味だった）。
    - 日時: 2026-01-04 00:10

- **初期テンプレートのフラット化修正**
    - 目的: 新仕様（フラット化＋グループID）に合わせるため。
    - 内容: `src/utils/templates.ts` 内の `GET_INITIAL_TEMPLATE` を修正。入れ子構造を廃止し、絶対座標と `data-group-id` を持つフラットな要素群を生成するように変更。
    - 日時: 2026-01-03 21:15

- **グループホバーと2段階選択UIの実装**
    - 目的: insert.mdのUI要件（グループ単位でのホバー・選択）を満たすため。
    - 内容: 
        - `MoveableManager.tsx`: ホバー用の Moveable を追加。グループ選択 Moveable に `renderDirections=["nw", "ne", "sw", "se"]` と `keepRatio` を設定。
        - `useMoveable.ts` / `useSelection.ts`: `hoverTargets` の管理ロジックを追加し、`handleMouseMove` でグループ判定を実施。
        - `index.css`: グループ化された要素の CSS アウトラインを抑制し、JSベースのオレンジ枠が際立つように調整。
    - 日時: 2026-01-03 21:50

- **ホバー時ちらつき修正と水色枠表示の改善**
    - 目的: insert.md の要件「グループホバー時はオレンジ枠のみ、個別選択時は水色枠も表示」を満たすため。
    - 内容:
        - `useMoveable.ts`: `handleMouseMove` を改善し、ホバー要素の祖先からも `data-group-id` を探索するように変更。
        - `MoveableManager.tsx`: オレンジ枠の Moveable を `selectionMode === 'group' || 'individual'` の両方で表示するように修正。個別選択時は draggable/resizable を無効化してオレンジ枠は表示のみとする。
        - `index.css`: グループ化された要素（`[data-group-id]`）にはCSSの outline を完全に無効化し、Moveable での制御に統一。
    - 日時: 2026-01-03 21:43

- **グループ外枠をオーバーレイ方式に変更**
    - 目的: 個別要素にちらつく枠ではなく、グループ全体を囲む単一の外枠を実現するため。
    - 内容:
        - `MoveableManager.tsx`: 根本から設計変更。
            - グループのバウンディングボックスを計算する `calculateGroupBounds` 関数を追加。
            - ホバー用オーバーレイ（`#group-hover-overlay`）と選択用オーバーレイ（`#group-selection-overlay`）をDOM要素として動的に作成。
            - ホバー時は `hoverTargets` からバウンディングボックスを計算し、オーバーレイ要素のスタイルを直接更新（CSSボーダーで枠を描画）。
            - グループ選択時は `groupOverlayRef` をMoveableの `target` として使用し、オーバーレイをドラッグ/リサイズ。操作時にグループ内全要素も連動して移動/リサイズ。
            - Moveable の `onDragGroup` / `onResizeGroup` ではなく、単一ターゲットの `onDrag` / `onResize` を使用。
    - 日時: 2026-01-03 21:48

- **オーバーレイのuseRef→useState変更によるレンダリング問題修正**
    - 目的: オレンジ枠が左上角に表示される問題を修正。
    - 内容:
        - `MoveableManager.tsx`: オーバーレイ管理を `useRef` から `useState` に変更。
            - `useRef` ではオーバーレイ作成後にReactの再レンダリングがトリガーされず、Moveableが正しいターゲット位置を認識できなかった。
            - `useState` を使用することで、オーバーレイ作成時に再レンダリングがトリガーされ、Moveableが正しいバウンディングボックス位置にポイントを表示できるようになった。
            - `showGroupMoveable` 変数を追加し、オーバーレイが存在かつ表示状態の場合のみMoveableをレンダリング。
            - `updateOverlayBounds` ヘルパー関数を追加し、オーバーレイ位置更新を共通化。
    - 日時: 2026-01-03 21:55

- **グループ選択モードと個別選択モードのUI分離**
    - 目的: グループ選択時はグループ専用メニュー、個別選択時は要素固有メニューを表示するため。
    - 内容:
        - `Workspace.tsx`: `FloatingMenu` に `selectionMode` と `activeSubTarget` を渡すように変更。
        - `FloatingMenu.tsx`: 大幅リファクタリング。
            - `selectionMode` と `activeSubTarget` を props として受け取り。
            - `selectionMode === 'group'` の場合はグループ専用メニュー（グループID表示、IDコピー、解除、削除）のみ表示。
            - `selectionMode === 'individual'` の場合は `activeSubTarget` を使用してテキスト/画像/シェイプメニューを表示。
            - ヘッダー部分にグループモード用のオレンジ色スタイリングを追加。
        - `MoveableManager.tsx`: ホバー用オーバーレイの `opacity: 0.6` を削除し、完全に不透明なオレンジ枠に変更。
    - 日時: 2026-01-03 22:10

- **メニュー位置修正、レスポンシブリサイズボタン廃止、グループリサイズのずれ修正**
    - 目的: メニューを上辺に表示し、不要なボタンを削除、リサイズ時のオレンジ枠ずれを解消するため。
    - 内容:
        - `FloatingMenu.tsx`: 
            - メニュー位置を常に要素の上辺に表示するように変更（CSSの `${...} px` スペースバグも修正）。
            - 図形メニューからレスポンシブリサイズボタン（`Maximize`）を削除。
        - `MoveableManager.tsx`:
            - グループリサイズ時の `onResize` を修正。`drag.transform` ではなく `drag.beforeTranslate` を使用し、オーバーレイの `left`/`top` を直接更新。
            - これにより、左上/右上/左下ポイントでリサイズしても、オレンジ枠とグループ要素の位置がずれなくなった。
    - 日時: 2026-01-03 22:37

- **グループポイントのオレンジ化と複数選択メニュー対応**
    - 目的: グループ選択時のポイントを水色からオレンジに変更。複数選択時（シフトキー）の専用メニューを追加。
    - 内容:
        - `index.css`:
            - `.moveable-group-selection .moveable-control` のCSSセレクタ詳細度を上げ、背景色 `#fff7ed` を追加してオレンジ系に統一。
        - `FloatingMenu.tsx`:
            - `canGroup` の場合（複数選択でまだグループ化されていない）の専用メニューを追加。
            - 青いヘッダーと「グループ化」「削除」ボタンのみを表示。
            - 既存グループ選択時（`isGroupMode`）と明確に分離。
    - 日時: 2026-01-03 22:50

- **isGrouped判定ロジックの修正**
    - 目的: 複数要素選択時（シフトキー）にグループ化メニューが表示されない問題を修正。
    - 内容:
        - `FloatingMenu.tsx`:
            - `isGrouped` の判定を「すべての選択要素が `data-group-id` を持っている」から「**すべての選択要素が同じ `data-group-id` を持っている**」に変更。
            - `firstGroupId` を取得し、すべての要素がこのIDと一致するかをチェック。
            - 異なるグループの要素を選択した場合は `isGrouped = false` となり、`canGroup = true` になるため、グループ化メニューが表示される。
    - 日時: 2026-01-03 23:05

- **複数選択UIのフィードバック改善とメニューの安定化**
    - 目的: シフトクリックで二つ目以降の要素を選択した際に、正しく選択されたことが視覚的に伝わるようにし、メニュー位置を安定させるため。
    - 内容:
        - `useFloatingMenu.ts`: 複数選択時に全要素を囲むバウンディングボックスを計算するように修正し、メニュー位置を上部中央に最適化。
        - `MoveableManager.tsx`: オレンジ枠の表示条件を `targets.length > 1` に緩和。未グループ化の複数選択でもオレンジ枠が出るように修正。
        - `useMoveable.ts`: シフトクリック時の副作用を整理。複数選択時は個別の水色枠を消してグループメニューを優先表示し、状態管理を安定化。
        - `FloatingMenu.tsx`: 青いヘッダーで「複数要素選択中」と表示し、「グループ化」「削除」ボタンを確実に提供。
- **要素削除時のUIクリーンアップ改善**
    - 目的: 要素削除後に水色の枠（Moveableのハンドル）がキャンバスに残ってしまう問題を解決するため。
    - 内容:
        - `FloatingMenu.tsx`: 削除ボタン（Trash2）の `onClick` 処理に `onClearSelection()` を追加。DOM要素の削除と同期して、Reactの状態（targets）を空にすることで、Moveable UIを即座に非表示にするように修正。
    - 日時: 2026-01-04 01:05

- **テキストボックス挿入機能の完成（色調・自動選択）**
    - 目的: テキスト挿入時の視認性を最大化し、操作性を向上。
    - 内容:
        - `useElementInsertion.ts`: デフォルトの `color` に `#000000 !important` を指定。`body` 等のグローバルな白文字設定に負けないように修正。
        - `useMoveable.ts` / `useEditorStore.ts`: `autoSelectId` による要素挿入後の自動ターゲット設定を配備。
    - 日時: 2026-01-04 01:00

- **テキストボックス挿入機能の改善（デフォルト色・自動選択）**
    - 目的: テキストボックス挿入時の視認性を高め、即座に編集・移動可能な状態にするため。
    - 内容:
        - `types/editor.ts` / `store/useEditorStore.ts`: `autoSelectId` ステートを追加。
        - `hooks/useElementInsertion.ts`: デフォルトの `color` を `#000000`（黒）に変更し、挿入後に ID を `autoSelectId` にセットするように修正。
        - `hooks/useMoveable.ts`: `autoSelectId` を監視し、DOM反映を待って自動的にターゲットを選択状態にする `useEffect` を追加。
    - 日時: 2026-01-04 00:00

- **グループ解除後の水色枠（選択中クラス）の残存バグ修正**
    - 目的: グループ解除直後に、要素が選択されていないにもかかわらず水色の枠（アウトライン）が残ってしまう問題を解決するため。
    - 内容:
        - `useTextEditing.ts`: `updateContentFromDOM` を修正。DOMのHTMLをストアに保存する際、一時的な選択中クラス（`.moveable-target-active`）をクリーンアップしてから保存するように変更。これにより、再レンダリング後に「選択されていないのに枠がある」状態を防止。
    - 日時: 2026-01-04 00:55

- **グループ解除直後の不要なメニュー（複数選択状態）の抑制**
    - 目的: グループを解除した直後に、残った要素に対して「グループ化」を促すメニューが表示されないようにするため。
    - 内容:
        - `useFloatingMenu.ts`: `handleUngroup` に選択をクリアするための `onClearSelection` コールバックを追加。
        - `FloatingMenu.tsx` / `Workspace.tsx`: グループ解除時に `selectNone` を実行するように配線。
        - `useMoveable.ts`: `Workspace` で利用できるように `selectNone` を return に追加。
    - 日時: 2026-01-04 00:45

- **グループ選択時のポイント表示安定化と退行バグ（枠消失）の修正**
    - 要件: ワンクリックでオレンジポイントを即座に表示させ、かつ個別選択も可能にする。
    - 解決方法: 
        - `MoveableManager.tsx`: `key` 導入による再マウント強制と、オーバーレイの `pointer-events: none` 徹底によりクリック貫通を復旧。
        - `index.css`: `.moveable-control` の可視性を `!important` で強制し、ホバーせずともポイントが表示されるよう調整。
    - 日時: 2026-01-04 00:30

- **複数選択UIのフィードバック改善とメニューの安定化**
    - 目的: 複数要素選択時にメニューが表示されない、位置が不安定、または選択されたかどうかが分かりにくい問題を解決するため。
    - 内容:
        - `useFloatingMenu.ts`: 複数選択時に全要素を囲むバウンディングボックスを計算するように修正し、メニュー位置を最適化。
        - `MoveableManager.tsx`: オレンジ枠の表示条件を `targets.length > 1` に緩和。
        - `useMoveable.ts`: シフトクリック時の副作用を整理。
        - `FloatingMenu.tsx`: 青いヘッダーで「複数要素選択中」と表示し、「グループ化」「削除」ボタンを表示。
    - 日時: 2026-01-03 23:55



## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **フラット化のメリット**: エディタ側での `react-moveable` による個別要素の操作（特にグループ内個別選択）が、親子構造よりも大幅にシンプルかつ安定する。
- **グループの定義**: 現在は `data-group-id` 属性が一致する要素群を論理的なグループとして扱っている。
- **座標計算の重要性**: フラット化を行う際、入れ子要素の相対座標を、デザイン領域全体からの絶対座標に正しく計算し直す必要がある。
- **初期テンプレートの制約**: `display: flex` はフラット化（絶対座標固定）と相性が悪いため、テンプレート内の各要素に具体的な `top`, `left`, `width` を指定して静的なレイアウトを構築する必要がある。
- **ホバー競合の解消**: CSS で `:hover` を使うと子要素・親要素で多重に枠が出てしまうが、JS (onMouseMove) でグループを特定して Moveable で描画することで、クリーンなグループハイライトを実現した。
- **ポイントの共存**: 2段階選択時、オレンジ（グループ）と水色（個別）のポイントが両方出るため、視覚的な重なりに注意が必要（現状は両方表示し、操作性を担保）。
- **ホバー時の祖先探索**: 子要素にマウスがある場合、`target.getAttribute('data-group-id')` だけでは null になる。`closest` または while ループで祖先を辿る必要がある。
- **CSS と JS の競合**: CSS の `:hover` pseudo-class と JS の Moveable 制御が競合してちらつきを発生させる。グループ要素には CSS outline を完全に無効化するのが安定策。
- **個別選択モード時のオレンジ枠維持**: `selectionMode === 'individual'` でもオレンジ枠を表示し続けるが、操作（drag/resize）は水色枠側で行う設計。
- **Moveableの複数ターゲットの制約**: `react-moveable` の `target` に配列を渡しても、グループ全体を覆う1つの外枠ではなく、各要素に個別の枠が描画される。グループ全体の外枠を表現するには、バウンディングボックスを計算してオーバーレイ要素を作成し、それをMoveableの単一ターゲットとする方式が有効。
- **オーバーレイと実要素の同期**: オーバーレイをドラッグ/リサイズする際に、実際のグループ要素も連動して更新する処理が必要。`onDragEnd` / `onResizeEnd` で位置を再計算してオーバーレイを更新する。
- **useRef vs useState**: `useRef` で管理したDOM要素は、作成されても再レンダリングをトリガーしない。Moveableの `target` として使用する場合、要素が存在することをReactに伝えるために `useState` を使用する必要がある。
- **inline styleの!importantは無効**: HTMLの `style` 属性に `!important` を書いても効果がない。CSSの仕様上の制約であり、`!important` はスタイルシート内でのみ有効。
- **CSS継承の競合**: `body` に `text-white` が設定されており、DesignSurface内に明示的な `color` を設定しないと白文字が継承されてテキストが見えなくなる。
- **ブラウザのデフォルト選択挙動**: キャンバス風のUIでは、要素のドラッグ操作がブラウザによってテキスト選択として解釈されることがある。これを防ぐには `user-select: none` の制御が不可欠。
- **!important の使い分け**: HTMLのインラインスタイルでは `!important` は無効だが、CSSファイル内（特に `[contenteditable]` 等の状態上書き）では、他のライブラリや動的スタイルの干渉を防ぐために有効。



## 4. 解決済み要件とその解決方法

- **要素・グループの複製機能**
    - 要件: テキスト、図形、画像、グループのメニューに「複製」ボタンを追加し、複製元からずらして作成。複数選択メニューには表示しない。
    - 解決方法: `useFloatingMenu` に共通の複製ロジックを実装。単一要素ならその要素を、グループならグループ内全要素を複製し、全体に新しいグループIDを付与（グループの場合のみ）。座標を+20pxし、`DesignSurface` の末尾に追加することで、`document.querySelector('.DesignSurface')` を用いた修正も含め完了。複製後に対象を自動選択するUI強化も実施。

- **テキストボックス挿入時のデフォルト文字色（黒）の保証**
    - 要件: テキストボックス挿入時、デフォルトのフォントカラーを黒にする。
    - 解決方法: `index.css` に `.DesignSurface { color: #000000; }` を追加したのに加え、`DesignArea.tsx` に `text-black` を適用。さらに `useElementInsertion.ts` での挿入時にも `color: #000000` を明示的に指定することで、継承問題を完全に解消した。

- **新規作成時のデフォルトデザインのフラット化**
    - 要件: 新規作成時のデフォルトデザインを新仕様に合わせ、すべてフラットな要素とする。
    - 解決方法: `src/utils/templates.ts` の `GET_INITIAL_TEMPLATE` を修正し、入れ子構造を廃止。各要素に `data-group-id` 属性と絶対座標スタイルを付与し、フラットな構造で生成するように変更。

- **グループホバー時のオレンジ枠表示**
    - 要件: グループ化された要素にホバー時、水色枠は非表示とし、グループ全体のオレンジ枠のみを不透明で表示する。
    - 解決方法: `MoveableManager.tsx` でホバー用オーバーレイ要素を作成し、バウンディングボックスを計算してオレンジ枠を描画。`opacity: 0.6` を削除して不透明に変更。

- **グループ選択時のオレンジ枠・ポイントのみ表示**
    - 要件: グループを1回クリック時、オレンジ枠とオレンジポイントのみを表示し、グループ専用メニュー（解除、削除、ID表示、コピー）を表示する。
    - 解決方法: `FloatingMenu.tsx` を修正し、`selectionMode === 'group'` の場合はグループ専用メニューのみ表示するように条件分岐を追加。`MoveableManager.tsx` に `key` を導入し、ワンクリック時にポイントが即座に描画されるよう再マウントを強制。`index.css` でポイントの可視性を `!important` で保持。

- **個別選択時のテキスト/画像/シェイプメニュー表示**
    - 要件: グループ内の個別要素をクリック時、オレンジ枠を維持しつつ水色枠とテキストメニュー等を表示する。
    - 解決方法: `FloatingMenu.tsx` に `activeSubTarget` を渡し、`selectionMode === 'individual'` の場合は `activeSubTarget` を使用して要素固有メニューを表示。

- **メニュー上辺表示、レスポンシブリサイズボタン廃止、グループリサイズのずれ修正**
    - 要件: メニューを要素の上辺に表示、レスポンシブリサイズボタン削除、グループリサイズ時のオレンジ枠ずれ修正。
    - 解決方法: `FloatingMenu.tsx` の位置計算を上辺固定に変更。`Maximize`ボタン削除。`MoveableManager.tsx` の `onResize` で `drag.beforeTranslate` を使用し、オーバーレイの `left`/`top` を直接更新。

- **グループポイントのオレンジ化**
    - 要件: グループ選択時の四隅ポイントを水色からオレンジに変更。
    - 解決方法: `index.css` で `.moveable-group-selection .moveable-control` のCSSセレクタ詳細度を上げ、背景色 `#fff7ed` を追加。

- **複数要素選択時の専用メニュー実装**
    - 要件: 複数選択時、青いヘッダーの「複数要素選択中」メニュー（グループ化・削除）を表示。既存グループ同士の統合も可能とする。
    - 解決方法: `FloatingMenu.tsx` の判定ロジックを刷新し、複数選択状態（`canGroup`）を最優先で表示。`useFloatingMenu.ts` で全要素を囲むバウンディングボックス計算を実装。`useMoveable.ts` でシフトクリック時の重複排除と属性一括付与（`handleGroup`）を強化。

- **要素削除時のUIクリーンアップ**
    - 要件: 削除ボタン押下時、要素だけでなく水色枠も消す。
    - 解決方法: `FloatingMenu.tsx` の削除処理に `onClearSelection` を追加し、ステートレベルで選択を解除するように修正。

- **テキストボックス挿入機能の改善**
    - 要件: デフォルト色を黒にし、挿入直後に自動選択状態にする。
    - 解決方法: `src/styles/index.css` に `.DesignSurface { color: #000000; }` を追加し、CSSレベルでデフォルトテキストカラーを黒に設定。`useElementInsertion.ts` でも `color: #000000` を指定。`autoSelectId` 経由で `useMoveable.ts` が挿入を検知し、自動的に `targets` に追加・選択モードへ移行。

- **グループ解除後のUIクリーンアップ**
    - 要件: 解除後に複数選択メニューを出さず、かつ水色枠も消す。
    - 解決方法: `handleUngroup` で `selectNone` を実行。保存ロジック（`updateContentFromDOM`）で `.moveable-target-active` クラスを強制除去することで、残存枠を根絶。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

- `src/utils/templates.ts`: 新規作成時の初期HTMLテンプレートを定義するユーティリティ。
- `src/utils/htmlProcessing.ts`: AIからの入れ子HTMLをフラット化するロジック `flattenHTML` を保持する中心地。
- `src/store/useEditorStore.ts`: エディタの状態管理（コンテンツ、座標拡張など）を行うZustandストア。
- `src/components/features/workspace/MoveableManager.tsx`: オレンジ枠（グループ用）と水色枠（個別用）の2段階選択UIを管理する核心コンポーネント。
- `src/hooks/moveable/useSelection.ts`: 選択モード（none, group, individual）の状態遷移を管理する。
- `src/hooks/useMoveable.ts`: Moveable関連のフックを統合し、ドラッグ/リサイズ後のDOM状態をストアに反映する。


## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

- **react-moveable**: ドラッグ、リサイズ、グループ操作を実現するライブラリ。
- **DOMParser / XMLSerializer**: HTML文字列の構造的な解析と加工（フラット化）に使用。
- **グループ移動の原理**: `onDragGroup` イベントを通じて、同一 `data-group-id` を持つすべての要素に同時に `transform` (CSS) を適用。
- **フラット化の動作原理**:
    1. 仮想DOM（`DOMParser`）上で入れ子構造を解析。
    2. 各子要素の累積座標（`offsetTop`/`offsetLeft`）を再計算し、新しい `style` 文字列を生成。
    3. すべての子要素を `DesignSurface` の直下に移動させ、親要素は削除。
    4. ストアの `content` をこのフラット化されたHTMLで更新。
