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
<content>現在、新規作成時も、開く選択時も、上書き保存できない。（ボタンctrl+Sいずれも不可）</content>
<current-situation>上書き保存しようとすると、編集前のデフォルト画面に戻ってしまい、編集後の状態で上書きされない。コンソールエラーは消えた。</current-situation>
<remarks>newpostの要素がテキストをuiで編集後、テキスト編集が確定されないのが、デフォルト画面に戻ってしまう原因かも。</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 2026-01-02 08:30 - HTML出力時の表示問題修正

**目的**: ブラウザでHTMLを開いた時に真っ白になる問題を解決

**変更内容**:
1. `src/utils/htmlProcessing.ts`
   - `extractDesignContent`: DesignSurfaceラッパーを除外し、純粋なコンテンツのみを返すよう修正
   - `constructFullHTML`: 
     - 二重ラッパー防止ロジック追加（hasDesignSurfaceチェック）
     - ブラウザ表示用の基本CSS追加（html, body に height: 100% 等）
     - 背景色を黒（#1a1a1a）に設定
     - DesignSurfaceに min-width/min-height を設定（position: absolute の子要素のみでも表示可能に）
     - overflow: auto に変更（大きなデザインでもスクロール可能）

### 2026-01-02 08:35 - 上書き保存問題の調査と修正

**目的**: 新規作成時・ファイルを開いた後に上書き保存できない問題を解決

**変更内容**:
1. `src/services/fileSystem.ts`
   - `saveToCurrentFile`: 保存前に書き込み権限を確認・再要求するロジック追加（queryPermission / requestPermission）
2. `src/hooks/useFileSystem.ts`
   - `handleOverwrite`: デバッグログ追加、エラーメッセージを詳細化

### 2026-01-02 08:45 - NaN エラーと HTML 抽出の修正

**目的**: コンソールの NaN エラーと、編集前に戻る問題を解決

**変更内容**:
1. `src/components/features/FloatingMenu.tsx`
   - フォントサイズ取得時に NaN が発生しないよう、デフォルト値（16）を設定
2. `src/utils/htmlProcessing.ts`
   - `extractDesignContent`: DOMパーサーを使用して信頼性を向上（ネストされた div 構造でも正しく抽出）


## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### 発見した問題の原因

1. **二重DesignSurfaceラッパー問題**
   - `extractDesignContent` が `<!-- DESIGN_START -->` ～ `<!-- DESIGN_END -->` の間をそのまま返していた
   - しかしその中には `<div class="DesignSurface">` が含まれている
   - 保存時に `constructFullHTML` がさらにラッパーを追加 → 二重ラップ

2. **ブラウザ表示時のスタイル不足**
   - 出力HTMLに `html, body { height: 100% }` がなかった
   - DesignSurface の `height: 100%` が親要素に依存して 0 になる
   - 内部要素が全て `position: absolute` のため、DesignSurface自体の高さが確保されない

### 設計上の制約

- `store.content` には常に「DesignSurfaceラッパーなし」のコンテンツを保存
- `Workspace.tsx` で表示時に `DesignSurface` クラスの div 内に配置
- 保存時に `constructFullHTML` がラッパーを追加してファイル出力

### 上書き保存問題の仮説

1. **File System Access API の権限問題**
   - ファイルハンドルはブラウザセッション中のみ有効
   - ページリロードで権限が失効する可能性
   - `createWritable()` 呼び出し前に権限確認が必要

2. **currentFileHandle が null の可能性**
   - 新規作成・開く処理で `setCurrentFileHandle` が正しく呼ばれていない
   - ストアへの保存タイミングの問題

3. **NaN エラーの原因**（2026-01-02 発見）
   - `FloatingMenu.tsx` で `parseFloat(fontSize)` が NaN を返すケース
   - 要素選択後、`window.getComputedStyle(target).fontSize` が空の場合
   - → デフォルト値（16）を設定して対応

4. **正規表現による HTML 抽出の問題**
   - ネストされた `</div>` タグで正規表現が誤マッチする可能性
   - → DOMパーサーを使用して信頼性を向上


## 4. 解決済み要件とその解決方法

### ブラウザでHTMLを開くと真っ白になる問題

**解決方法**:
- `extractDesignContent` でDesignSurfaceラッパーを除去し、純粋なコンテンツのみを返すよう修正
- `constructFullHTML` でブラウザ表示用の基本CSS（html, body の高さ、背景色#1a1a1a、flexbox配置）を追加
- DesignSurfaceに min-width/min-height 設定で position: absolute の子要素のみでも表示可能に

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

```
src/utils/htmlProcessing.ts    - HTML解析・構築ユーティリティ（メタデータ抽出、デザイン抽出、クリーンアップ、完全HTML構築）
src/hooks/useFileSystem.ts     - ファイル操作フック（新規作成、開く、上書き保存）
src/hooks/useMoveable.ts       - GUI編集フック（要素選択、ドラッグ操作、DOM→content同期）
src/components/features/Workspace.tsx - デザイン領域表示コンポーネント（content描画、Moveable統合）
src/store/useEditorStore.ts    - グローバル状態管理（content, pageSize, metaMessage等）
src/utils/templates.ts         - 初期テンプレート生成（A4, 9:16, SQUARE）
src/services/fileSystem.ts     - ファイルシステムAPIラッパー（フォルダ選択、読み書き、ファイル作成）
```

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### 保存フロー

```
useFileSystem.handleOverwrite()
  → store から content, metaMessage 取得
  → htmlProcessing.constructFullHTML(content, meta) で完全HTML生成
  → services.fileSystemService.saveToCurrentFile() でファイル書き込み
```

### 読み込みフロー

```
useFileSystem.handleOpen()
  → services.fileSystemService.openFileFromFolder() でHTML取得
  → htmlProcessing.extractDesignContent() でコンテンツ抽出（ラッパー除去）
  → htmlProcessing.parseMetaMessage() でメタデータ抽出
  → store.setContent() でエディタに反映
```

### DOM同期フロー

```
Workspace 内で GUI 操作
  → useMoveable.updateContentFromDOM() 
  → DesignSurface.innerHTML を取得（ラッパーなしコンテンツ）
  → store.setContent() で更新
```
