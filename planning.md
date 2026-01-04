# AIへの指示機能改善 計画書

## 概要
指示書（instructoion.md）に基づき、エディタの「AIへの指示」機能を改善しました。
主な目的は、UIの名称変更、指示項目の刷新、固定ルールの新設、および配色設定の柔軟性向上です。

## 実施内容

### 1. 型定義の更新 (`src/types/editor.ts`)
- `MetaMessage` インターフェースを刷新。
  - `fixedRules` (固定ルール) 追加
  - `collaborativeRules` (共同編集ルール) 追加
  - `designConcept` (デザインコンセプト) 追加
  - `colors` のフィールド名を `main`, `sub`, `accent` に変更
  - カラーに `'none'` (選択なし) を許容

### 2. ストアの更新 (`src/store/useEditorStore.ts`)
- 初期状態(`initialState.metaMessage`)を新しい型に合わせて更新。

### 3. HTML処理ロジックの更新 (`src/utils/htmlProcessing.ts`)
- `parseMetaMessage`:
  - `FIXED_RULES_START` ブロックから固定ルールを抽出する処理を追加。
  - 旧形式からの移行ロジック（`requirements` -> `collaborativeRules` など）を実装。
- `constructFullHTML`:
  - 固定ルールを `FIXED_RULES_START` ブロックとして `USER_REQUIREMENT_START` タグの外部に出力。
  - AIへのシステムプロンプトを最新のルール（固定ルールの編集禁止など）に合わせて日本語で更新。

### 4. UIの刷新 (`src/components/common/MetaMessageEditor.tsx`)
- ヘッダーを「AIへの指示」に変更。
- 各セクションを新要件に合わせて統合・新設。
- カラーデザインセクション:
  - ラベルを指示通り変更（メイン、サブ、アクセント）。
  - 「選択なし」ボタンを追加し、機能させました。
  - RGB入力を排除し、HEX入力と標準カラーピッカーに絞りました。
- 「設定を反映」ボタン押下時に `handleOverwrite` を呼び出し、上書き保存を実行するよう変更。

### 5. ナビゲーションバーの更新 (`src/components/common/Navbar.tsx`)
- 「AI要件」ラベルを「AIへの指示」に変更。

## 検証項目
- [x] メニューバーのラベルが「AIへの指示」になっているか。
- [x] ダイアログの項目が指示通り刷新されているか。
- [x] カラーで「選択なし」を選べるか。
- [x] 「設定を反映」を押すと上書き保存が走るか。
- [x] 生成されたHTMLで「固定ルール」がタグの外に出ているか。
- [x] 旧形式のHTMLを読み込んだ際、適切にデータが引き継がれるか（移行ロジック）。
