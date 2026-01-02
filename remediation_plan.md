# ルール遵守のための修正計画

## 概要
`.agent/rules/rules.md` に定義された開発ルールに従い、現状のコードベースの不備（300行超え、`any`の使用、不適切なスタイリング等）を修正します。

## 修正対象と内容

### 1. ファイルサイズの削減 (300行制限)
- [ ] `src/components/features/FloatingMenu.tsx` (542行)
    - メニュー項目やカラーパレット部分をコンポーネントとして抽出する。
    - ロジックをカスタムフック（`useFloatingMenu.ts`）へ移動する。
- [ ] `src/hooks/useMoveable.ts` (346行)
    - 選択ロジック、リサイズロジック、イベントハンドリングなどを分離する。
- [ ] `src/components/features/Workspace.tsx` (359行)
    - 内容を整理し、子コンポーネントを別ファイルへ切り出す。

### 2. 型安全の徹底 (`any` の排除)
- [ ] `src/hooks/useMoveable.ts`
    - イベント型 (`any`) を適切な型に修正。
- [ ] `src/components/features/ImageSaveWizard.tsx`
    - `as any` キャストを削除し、適切な型定義を適用。

### 3. スタイリングの適正化
- [ ] `src/components/features/ComparisonView.tsx`
    - 静的な `style` 属性を Tailwind CSS クラスに置き換え。
- [ ] その他のファイルにおける静的スタイルの調査と修正。

### 4. 命名規則とディレクトリ構造の確認
- [ ] ディレクトリ名が `kebab-case` になっているか確認。
- [ ] ファイル名が `PascalCase`（コンポーネント）または `camelCase` になっているか確認。

### 5. デッドコードの削除
- [ ] 未使用のインポート、変数、関数を削除。

## 実行順序
1. 型の修正 (`any` の排除) - 最も簡単で安全。
2. スタイリングの修正。
3. `FloatingMenu.tsx` の分割。
4. `useMoveable.ts` の分割。
5. `Workspace.tsx` の分割。
6. 全体のクリーンアップ。
