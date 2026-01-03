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
<content>

## AIリンク機能を完成させる
以下の要件をすべて満たすように、コードを編集する。

### エディタへの反映
- filesystemAPIにより、エディタは、読み込んだデザインHTMLのバッググラウンドでの上書き保存をリアルタイムで検知する。
- 検知した場合、ページ上のすべてのUIをロックし、読み込み中の表示を表示する。
**エディタ上でユーザーが名前を付けて保存、上書き保存をした場合はロックしないこと。**
- <!-- DESIGN_START -->と<!-- DESIGN_END -->の間のコードの変更のみを、エディタに反映する。（デザイン領域以外のスタイルの破壊を防ぐため）
- 変更のレンダリングが完了したら、ロックは維持したまま、メニューバーの下に、一時バーを表示する。
- 一時バーは、承認ボタン、破棄ボタン、比較ボタンのみとする（×ボタンはつけない）
**ページはロックされてるが、一時バーのみ操作可能にすること。**
- 承認した場合は、上書き保存後、ロック解除。
- 破棄した場合は、AIの変更を破棄し、元のデザインに戻して上書き保存。
- 比較ボタンを押すと、ロックしたまま、ウィンドウが左右に分かれ、変更前と変更後のスクショを比較できる。（この画面には×ボタンを付け、×ボタンを押すと、一時バーに戻れる）
**読み込み検知時、まず現在のキャンバスをメモリ上に一時画像（Base64等）として保存し、その後HTMLを更新して比較ビューを開く。**

### 注意点
- **スクショ比較機能以外はproject-rootで実装されているので、積極的に参考にすること。**

</content>
<current-situation>現在、外部での変更をエディタが検知しない。</current-situation>
<remarks>画像のコンソールエラー見て！</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

</uneditable>

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件（移動許可がNGの要件は絶対に移動・編集しないこと）（勝手に移動許可をOKに書き換えないこと）

<requirement>
<content></content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **2026-01-03 13:45**: AIリンク機能の完成（初回試行）
    - UIパーツの整備と比較画面の実装。
- **2026-01-03 13:55**: 自動同期ロジックの抜本的修正（再チャレンジ）
    - ハンドル名の修正と polling 方式への切り替え。
- **2026-01-03 14:05**: 実行時エラー (SecurityError) の修正と堅牢化
    - `index.html`: Google Fonts の CSS 読み込みに `crossorigin="anonymous"` を追加。
    - `screenshot.ts`: `html-to-image` のオプション調整 (`skipFonts`, `fontEmbedCSS`) により CORS エラーを回避。
    - `useAutoSync.ts`: スクショ失敗時も同期処理を中断させないための多重 try-catch 機構を導入。


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **SecurityError による同期の停止**: `html-to-image` が外部 CSS (Google Fonts) のパースに失敗すると `SecurityError` を投げ、それが catch されていないと同期フロー全体が途中で死んでしまう問題を確認。
- **CORS 対応の重要性**: `toPng` などの DOM 変換ライブラリは CSS ルールを読み取るため、外部 CSS リンクには `crossorigin` 属性が必須。
- **フェイルセーフな設計**: スクリーンショットはあくまで「比較用」の付加情報であるため、その失敗が「エディタへの反映（同期）」という主目的を妨げてはならない。


## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

- `src/hooks/useAutoSync.ts`: Vite からの更新シグナルを待ち、スクショ取得とファイル最新化を行う Bridge 層。
- `src/store/useEditorStore.ts`: ロック状態、保留中の変更、スクショ、承認ロジックを管理するデータ層。
- `src/app/App.tsx`: 各 UI (Workspace, TemporaryBar, ComparisonView) のレイアウトとグローバルロックを制御する Root UI。
- `src/components/common/TemporaryBar.tsx`: ユーザーに変更の承認・破棄を迫るための専用操作バー。
- `src/components/features/ComparisonView.tsx`: 変更前画像と現在の HTML を並べて表示する比較 UI。
- `src/utils/htmlProcessing.ts`: HTML からデザイン部分の抽出や、保存用の完全な HTML を構築する Logic。
- `src/utils/screenshot.ts`: デザイン領域のスクリーンショットを生成する Utility。
- `vite.config.ts`: サーバーサイドで HTML の変更を監視し、シグナルを送信する Config。


## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

- **Vite WS Connection**: サーバーとクライアントを Websocket で繋ぎ、ファイル変更をミリ秒単位で通知。
- **html-to-image (toPng)**: 既存の DOM 構造を画像化することで、変更前の状態をメモリ上に保存。
- **Zustand State Management**: `isLocked`, `hasPendingChanges` などのフラグにより、アプリ全体の挙動を動的に切り替え。
- **Tailwind CSS & Lucide Icons**: プレミアムなデザインと視認性の高いアイコンを提供。
- **DOMParser**: 外部から届いた HTML をパースし、必要な部分（デザイン領域）だけを安全に抽出。

