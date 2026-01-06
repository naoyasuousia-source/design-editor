# ルール準拠リファクタリング計画書

## 目的
`.agent/rules/rules.md` に定義された開発ルールを完全に遵守する状態にする。

## 実施事項

### 1. 型安全性の向上 (No any)
- [ ] `src/services/image/imageCropService.ts` の `any` を排除。

### 2. Logic(utils) の純粋化
- [ ] `src/utils/bounds.ts` から `getBoundingClientRect` を排除。
- [ ] `src/utils/html/parser.ts` の環境依存コード（DOMParser）の扱いを再検討。

### 3. Logic-UI 分離の徹底
- [ ] `DesignArea.tsx` 内のパス置換ロジックを `utils/` へ。
- [ ] `DesignArea.tsx` 内の `onDrop` DOM操作を `services/` へ。

### 4. 300行制限への対応
- [ ] `Navbar.tsx` のコンポーネント分割。

### 5. スタイリングルールの整理
- [ ] `index.css` の冗長なスタイルの Tailwind 移行。

## スケジュール
1. Phase 1: 型と基本的ルールの修正
2. Phase 2: Logic-UI 分離と Utils の純粋化
3. Phase 3: コンポーネント分割
4. Phase 4: 最終確認とデッドコード削除
