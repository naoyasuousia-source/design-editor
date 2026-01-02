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
<content>テキストボックスをクリックしたら、拡大縮小ポイントが表示され、さらにテキストをダブルクリックすると、テキスト編集モードとなり、テキスト内の任意の位置にキャレットが挿入でき、編集でき、テキストボックス外を押すと、編集が確定し、テキストボックスの選択が解除されるようにしたい。</content>
<current-situation>シングルクリックでは拡大縮小ポイント表示され、そとクリックで選択が解除される。しかし、ダブルクリックしてもキャレットが挿入されず、現状テキスト編集不可である。コンソールは先ほどと変化したが、依然uiではダブルクリックで何も起こらない。</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

<requirement>
<content>テキストボックスにはpaddingをつけることを禁じる。デフォルトのNerPostの場合は、黒枠の白四角図形を親要素とし、その中に子要素として、二つのテキストボックスを配置する。</content>
<current-situation></current-situation>
<remarks></remarks>
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

### 2026-01-02 08:52 - テキスト編集確定前の保存問題を修正

**目的**: テキスト編集中に保存すると編集前に戻る問題を解決

**原因**: テキスト編集中（contentEditable=true）のまま保存すると、blur イベントが発火せず `updateContentFromDOM` が呼ばれないため、古い content が保存される

**変更内容**:
1. `src/hooks/useHotkeys.ts`
   - Ctrl+S 押下時、編集中の要素があれば blur を発生させてから保存
   - `requestAnimationFrame` で blur 後のストア更新を待つ
2. `src/components/common/Navbar.tsx`
   - 保存ボタン用の `handleSave` 関数を追加（同様の blur 処理）
   - NavButton の onClick を `handleSave` に変更

### 2026-01-02 09:02 - テキストボックス外クリック時の編集確定問題を修正

**目的**: テキストボックス外をクリックしても選択が解除されず、変更が確定しない問題を解決

**原因**: 
1. `handleCanvasClick` が編集中要素の外側クリックを正しく処理していなかった
2. blur イベントに依存していたが、イベントの発火タイミングが不安定

**変更内容**:
1. `src/hooks/useMoveable.ts`
   - `editingElementRef` を追加して編集中の要素を追跡
   - `finishEditing` 関数を追加（編集終了と更新の一元管理）
   - `handleCanvasClick`: 編集中要素の外側クリック時に `finishEditing` を呼び出し
   - `handleDoubleClick`: `caretRangeFromPoint` でクリック位置にカーソルを配置
   - Esc キーで編集終了も追加

### 2026-01-02 09:17 - テキスト編集が確定されない問題（リグレッション修正）

**目的**: 「なにをしても変更が確定しなくなった」リグレッションを解決

**原因**: 
- DesignSurface 全体に `contentEditable={!isLocked}` が設定されていた
- 内部要素の `contentEditable` 設定と競合
- `updateContentFromDOM` が `contentEditable` 属性を含んだまま保存

**変更内容**:
1. `src/components/features/Workspace.tsx`
   - DesignSurface から `contentEditable` と `suppressContentEditableWarning` を削除
   - 個別の子要素でのみテキスト編集を許可
2. `src/hooks/useMoveable.ts`
   - `isEditingRef` を追加して編集状態を明示的に追跡
   - `updateContentFromDOM`: contentEditable 属性を削除してから HTML を取得
   - `finishEditing`: blur() を呼び出してフォーカスを解除
   - デバッグログを追加

### 2026-01-02 09:23 - ダブルクリックでテキスト編集モードに入れない問題のデバッグ

**目的**: ダブルクリックしてもキャレットが挿入されない問題を調査

**変更内容**:
1. `src/hooks/useMoveable.ts`
   - `handleDoubleClick` に詳細なデバッグログを追加
   - `target.focus()` を必ず呼び出すように変更（try-catch 前に移動）
   - カーソル位置設定を try-catch でラップしてエラーをキャッチ

### 2026-01-02 09:27 - ダブルクリックイベントが発火しない問題を修正

**目的**: handleDoubleClick が呼ばれない問題を解決

**原因**: 
- 外側の canvas div に `onDoubleClick` が設定されていたが、DesignSurface div には設定されていなかった
- `dangerouslySetInnerHTML` を使用しているため、内部要素のイベントが親要素の React イベントハンドラにバブルアップしない

**変更内容**:
1. `src/components/features/Workspace.tsx`
   - DesignSurface div に `onDoubleClick={handleDoubleClick}` を追加
   - DesignSurface div に `onMouseDown={handleCanvasClick}` を追加

### 2026-01-02 09:55 - テキスト編集モード移行時の描画干渉を修正

**目的**: ダブルクリックしてもテキスト編集モードに入れない（キャレットが出ない）問題を解決

**原因**: 
- `handleDoubleClick` 内で `setTargets([])` を呼び出すと、親の `Workspace` が再描画される。
- `Workspace` が再描画される際、`dangerouslySetInnerHTML={{ __html: content }}` が再適用される。
- これにより、`target.contentEditable = 'true'` と直接書き換えた DOM が、元の属性なし HTML で上書きされて消滅していた。

**解決方法**:
1. `src/components/features/Workspace.tsx`
   - `DesignContent` コンポーネントを `React.memo` で作成。`content` が変わらない限り再描画しないように設定。
   - `Workspace` 内の他の状態（`targets` 等）が変化しても、デザイン領域全体の DOM ツリーが保持されるようにした。
2. `src/hooks/useMoveable.ts`
   - `handleDoubleClick` において、`requestAnimationFrame` を使用して再描画サイクルと競合しないようにフォーカスとカーソル位置を設定。
   - `e.stopPropagation()` を追加し、イベントの重複発火を抑制。

**結果**: 
- 編集中の状態が再描画によってリセットされなくなり、正常にキャレットが挿入され編集可能になった。


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

5. **テキスト編集確定前の保存問題**（2026-01-02 発見・解決）
   - テキストをダブルクリックで編集モードに入る（contentEditable=true）
   - 編集中のまま Ctrl+S で保存すると、blur イベントが発火しない
   - `updateContentFromDOM` が呼ばれず、古い content が保存される
   - → 保存前に強制的に blur を発生させて解決

6. **テキストボックス外クリック時の編集確定問題**（2026-01-02 発見・解決）
   - `handleCanvasClick` が `target.contentEditable === 'true'` のチェックのみで、他の要素の編集状態を確認していなかった
   - blur イベントはマウスダウン後に発火するため、タイミングが不安定
   - → `editingElementRef` で編集中要素を追跡し、外側クリック時に `finishEditing` を呼び出す

7. **ダブルクリック位置にカーソルが配置されない問題**（2026-01-02 発見・解決）
   - `target.focus()` はカーソルを先頭に配置する
   - → `caretRangeFromPoint` でマウス位置からテキストノード内の位置を特定

8. **DesignSurface の contentEditable 問題**（2026-01-02 発見・解決）
   - Workspace.tsx の DesignSurface に `contentEditable={!isLocked}` が設定されていた
   - これにより、DesignSurface 全体が編集可能になり、内部要素の contentEditable 設定と競合
   - `updateContentFromDOM` が contentEditable 属性を含んだままの HTML を保存
   - → DesignSurface から contentEditable を削除し、個別の子要素でのみテキスト編集を許可
   - → `updateContentFromDOM` で contentEditable 属性を削除してから HTML を取得

9. **ダブルクリックイベントが発火しない問題**（2026-01-02 発見・解決）
   - 外側の canvas div に `onDoubleClick` が設定されていたが、DesignSurface div には設定されていなかった
   - `dangerouslySetInnerHTML` を使用しているため、内部要素のイベントが React の合成イベントシステムでバブルアップしない
   - → DesignSurface div に直接 `onDoubleClick` と `onMouseDown` を追加

10. **Moveable によるダブルクリックの干渉**（2026-01-02 発見・解決）
    - `handleCanvasClick` で要素が選択されると `Moveable` の UI が要素の上に重なる。
    - そのため、2回目のクリックが `Moveable` のコントロールの一部（または非可視のオーバーレイ）に当たり、同一要素への `onDoubleClick` として成立しない場合がある。
    - → `onMouseDown` (handleCanvasClick) 内で `e.detail === 2` を見ることで、ダブルクリックを確実に初動でキャッチして解決。

11. **React.memo による DOM 保護の必要性**（2026-01-02 発見・解決）
    - `dangerouslySetInnerHTML` を使っている環境で、直接 DOM 操作（`contentEditable`等）を行う場合、親コンポーネントの再描画が「DOM の再適用（初期化）」を引き起こすため、`React.memo` や `useMemo` で DOM ツリーの更新を明示的に抑制する必要がある。


## 4. 解決済み要件とその解決方法

### ブラウザでHTMLを開くと真っ白になる問題

**解決方法**:
- `extractDesignContent` でDesignSurfaceラッパーを除去し、純粋なコンテンツのみを返すよう修正
- `constructFullHTML` でブラウザ表示用の基本CSS（html, body の高さ、背景色#1a1a1a、flexbox配置）を追加
- DesignSurfaceに min-width/min-height 設定で position: absolute の子要素のみでも表示可能に

### 上書き保存時に編集前の状態に戻る問題

**解決方法**:
- テキスト編集中（contentEditable=true）のまま保存すると blur が発火せず古い content が保存される
- 保存前に強制的に `activeElement.blur()` を呼び出してテキスト編集を確定
- `requestAnimationFrame` で blur 後のストア更新を待ってから保存

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
