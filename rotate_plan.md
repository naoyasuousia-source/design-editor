# 要素回転機能の実装計画

## 1. 概要
`rotate.md`に基づき、全要素（テキスト、画像、図形、グループ）に対して回転機能を実装する。
特に、カスタム回転ハンドルのUIデザインと、ワンクリックで表示される個別回転メニュー（90度回転、リセット）の実装に重点を置く。

## 2. 変更内容

### 2.1 ユーティリティ・サービス層 (`src/utils`, `src/services`)
- `src/utils/rotationUtils.ts` の新規作成
    - `getRotation(el: HTMLElement): number`: `transform` から現在の回転角度（deg）を抽出する。
    - `parseTransform(transform: string): { rotate: number }`: transform 文字列をパースする。
- `src/services/rotationService.ts` の新規作成
    - `rotateElement(el: HTMLElement, degree: number)`: 要素を回転させる。
    - `resetRotation(el: HTMLElement)`: 回転を0度に戻す。
    - `rotateGroup(targets: HTMLElement[], deltaDegree: number, center: { x: number, y: number })`: グループ全体をセンター中心に回転させる。

### 2.2 UIコンポーネント層 (`src/components`)
- `src/components/features/workspace/RotationPicker.tsx` の新規作成
    - 「90度回転」「リセット」ボタンを持つ小さなフローティングメニュー。
- `IndividualMoveable.tsx` の更新
    - `rotatable={true}` を有効化。
    - `renderDirections` に回転ハンドルを含める。
    - カスタム回転ハンドルのCSSスタイリング（白丸背景 + 2方向矢印）。
    - 回転ハンドルクリック時の `RotationPicker` 表示ロジック。
- `GroupMoveable.tsx` の更新
    - グループ全体を回転可能にする。
    - 回転中の各要素の座標・回転同期ロジック。

### 2.3 Bridge層 (`src/hooks`)
- `src/hooks/moveable/useRotate.ts` (または `useMoveableHandlers.ts` への追加)
    - 回転イベントのハンドリング。
    - `onRotate`, `onRotateEnd` の実装。

## 3. 実装のステップ

1. `rotationUtils.ts` と `rotationService.ts` の実装。
2. `RotationPicker.tsx` の作成。
3. `IndividualMoveable.tsx` への回転機能追加とカスタムハンドルの実装。
4. `GroupMoveable.tsx` への回転機能追加とグループ回転ロジックの実装。
5. 全体的なUI調整と `rotate.md` との整合性確認。

## 4. 注意点
- `transform: rotate(Ndeg)` 方式に統一する。
- グループ回転時は、グループ化された時点の状態を 0度として扱う。
- `rules.md` に従い、ドラッグ中のプレビューは `ref` を介した直接的なDOM操作で行い、終了時に State へ同期する。
