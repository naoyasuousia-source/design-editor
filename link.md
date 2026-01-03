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

**エディタ上でユーザーが名前を付けて保存、上書き保存をした場合はロックしないこと。**

</content>
<current-situation>現在、エディタ上で上書き保存した場合でも、自動編集フローに入ってしまう。</current-situation>
<remarks>project-rootでは実装されているので、積極的に参考にすること。</remarks>
<permission-to-move>OK</permission-to-move>
</requirement>

<requirement>
<content>

- 自動編集検知時、エディタに変更を反映した状態で一時バー出すようにしたい。
- 「AI変更を適用中」の表示は、自動編集検知時のみ表示し、レンダリング完了したタイミングで、一時バーと入れ替わりで非表示にする
</content>
<current-situation>解決済み。検知時に `prePendingContent` に退避しつつ、キャンバスに即時反映。数秒のオーバーレイ表示後に操作バーに切り替わるように実装。</current-situation>
<remarks></remarks>
<permission-to-move>OK</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **2026-01-03 13:45**: AIリンク機能の完成（初回試行）
    - UIパーツの整備と比較画面の実装。
- **2026-01-03 13:55**: 自動同期ロジックの抜本的修正（再チャレンジ）
    - ハンドル名の修正と polling 方式への切り替え。
- **2026-01-03 14:05**: 実行時エラー (SecurityError) の修正と堅牢化
    - `index.html`, `screenshot.ts`: CORS 対応とフォルトトレラントなスクショ機構。
- **2026-01-03 14:15**: 自己保存によるループの防止
    - `useFileSystem.ts`, `useEditorStore.ts`, `useAutoSync.ts`: タイムスタンプ管理の強化。
- **2026-01-03 14:25**: 非同期反映フローへの改善
    - `useEditorStore.ts`: `prePendingContent` (退避用) と `isApplyingUpdate` (読込中フラグ) を追加。
    - `detectExternalUpdate`: キャンバスの `content` を即座に更新するように変更。
    - `useAutoSync.ts`: 反映から一定時間後に `isApplyingUpdate` を解除し、一時バーへ遷移する制御を追加。
    - `DesignArea.tsx`: `isLocked` ではなく `isApplyingUpdate` でオーバーレイを表示するように修正。


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **SecurityError による同期の停止**: `html-to-image` が外部 CSS (Google Fonts) のパースに失敗すると `SecurityError` を投げ、それが catch されていないと同期フロー全体が途中で死んでしまう問題を確認。
- **レースコンディションの克服**: ファイルの書き込み完了 *後* に保存時刻を記録すると、その書き込み自体によって発生した OS の変更通知が、記録よりも先に検知されてしまう。これを防ぐため、書き込みに *入る直前* に「今から保存する」という意志を timestamp として記録するようにした。
- **承認/破棄フローの完結**: AI の変更を承認（または破棄）した際の上書き保存も「自己保存」として扱う必要があるため、これら全ての書き込み経路に `lastSaveTime` の更新を組み込んだ。


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

