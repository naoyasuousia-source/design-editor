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

- 新規作成時のデフォルトデザインを新仕様に合わせ、すべてフラットな要素とする。
</content>
<current-situation>現在は親子構造になってしまっている。</current-situation>
<remarks>

**insert.mdの要件に厳密に従うこと。**</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>


## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

- **初期テンプレートのフラット化修正**
    - 目的: 新仕様（フラット化＋グループID）に合わせるため。
    - 内容: `src/utils/templates.ts` 内の `GET_INITIAL_TEMPLATE` を修正。入れ子構造を廃止し、絶対座標と `data-group-id` を持つフラットな要素群を生成するように変更。
    - 日時: 2026-01-03 21:15


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

- **フラット化のメリット**: エディタ側での `react-moveable` による個別要素の操作（特にグループ内個別選択）が、親子構造よりも大幅にシンプルかつ安定する。
- **グループの定義**: 現在は `data-group-id` 属性が一致する要素群を論理的なグループとして扱っている。
- **座標計算の重要性**: フラット化を行う際、入れ子要素の相対座標を、デザイン領域全体からの絶対座標に正しく計算し直す必要がある。
- **初期テンプレートの制約**: `display: flex` はフラット化（絶対座標固定）と相性が悪いため、テンプレート内の各要素に具体的な `top`, `left`, `width` を指定して静的なレイアウトを構築する必要がある。


## 4. 解決済み要件とその解決方法

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
