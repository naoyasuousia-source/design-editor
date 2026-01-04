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
- 「画像として保存」メニューで、トリミング、保存ボタンに加えて、透明背景チェックボックスを配置する。
- デフォルトはチェックなしで、チェックありの場合は、今まで通り、要素のみを保存。
- チェックなしの場合は、白背景をつけて保存する。
</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- 2026-01-05: `ImageSaveWizard.tsx` に透明背景切り替え用のトグルスイッチ（UI）を追加。
- 2026-01-05: `html-to-image` (toPng) のオプションに `backgroundColor` を追加。トグルが OFF (デフォルト) の場合は `#ffffff`、ON の場合は背景なし（透明）で出力されるよう実装。
- 2026-01-05: `HintDialog.tsx` のフッターから「エディタに戻る」ボタンを削除。
- 2026-01-05: `HintDialog.tsx` の `React.cloneElement` における Lucide アイコンの型エラーを `any` キャストで解消。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **背景色の挙動**: `html-to-image` はデフォルトで透明背景を出力する。そのため、「白背景をつけて保存」という要件を満たすには、明示的に `backgroundColor: '#ffffff'` を指定する必要があった。
- **トグルの初期値**: ユーザー要件に従い `false` (チェックなし) をデフォルトとし、白背景で保存されるように設定した。
- **型定義の競合**: `HintDialog.tsx` で `LucideIcon` を `cloneElement` する際、`size` プロパティの型が `Partial<unknown>` と推定されエラーになっていたため、キャストによる回避を行った。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

- `src/components/features/ImageSaveWizard.tsx`: 画像保存ウィザード UI。トリミング機能と PNG 出力ロジックを含む。
- `src/components/common/HintDialog.tsx`: エディタのヒント/ガイドダイアログ。AI連携ワークフローを表示。
- `src/utils/cn.ts`: Tailwind CSS のクラス結合用ユーティリティ。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

- **html-to-image**: DOM 要素（`.DesignSurface`）をターゲットに PNG 画像を生成。
- **Lucide React**: 視覚的なフィードバック（Camera, Check, X, etc.）のためのアイコン。
- **Tailwind CSS**: プレミアムなトグルスイッチのスタイリングに使用。
- **React Hooks**: `useState` による保存オプション（透明背景）の管理。
