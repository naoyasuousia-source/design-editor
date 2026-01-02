# ズーム倍率機能の仕様変更

## 変更内容

### 1. 倍率の刻み幅の変更

**旧仕様**:
- すべての範囲で25%刻み（0.5～3.0）

**新仕様**:
- **50%～150%**: 10%刻み
  - 50%, 60%, 70%, 80%, 90%, 100%, 110%, 120%, 130%, 140%, 150%
- **150%超～300%**: 25%刻み
  - 175%, 200%, 225%, 250%, 275%, 300%

### 2. ドロップダウンメニューの追加

倍率表示（例: "100%"）をクリックすると、すべての利用可能な倍率がドロップダウンで表示されるようになりました。

## 実装詳細

### 新規作成ファイル

#### 1. `src/utils/zoomLevels.ts` (Logic層)
**役割**: ズーム倍率の計算ロジックを集約

**提供する関数**:
- `getAvailableZoomLevels()`: 利用可能な全倍率を配列で返す
- `getNearestZoomLevel(currentZoom)`: 現在値に最も近い倍率を返す
- `getNextZoomLevel(currentZoom)`: 次の倍率を返す（拡大）
- `getPreviousZoomLevel(currentZoom)`: 前の倍率を返す（縮小）

**倍率配列**:
```typescript
[0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0]
```

#### 2. `src/components/common/ZoomControl.tsx` (UI層)
**役割**: ズーム倍率の表示と操作UIを提供

**機能**:
- **+/-ボタン**: 次/前の倍率に変更
- **倍率表示ボタン**: クリックするとドロップダウンメニューを表示
- **ドロップダウンメニュー**: 全倍率をリスト表示、現在の倍率をハイライト
- **外側クリック検知**: ドロップダウンを自動で閉じる
- **無効化状態**: 最小/最大倍率で+/-ボタンを無効化

### 修正ファイル

#### `src/components/common/Navbar.tsx`
- `ZoomControl` コンポーネントをインポート
- 既存のインラインズームUIを `<ZoomControl zoom={zoom} onZoomChange={setZoom} />` に置き換え

## UIの動作

### +/-ボタン
- **-ボタン**: 1つ前の倍率に縮小（50%で無効化）
- **+ボタン**: 1つ次の倍率に拡大（300%で無効化）

### 倍率表示クリック
1. 倍率表示（例: "100%"）をクリック
2. ドロップダウンメニューが表示される
3. 全17段階の倍率がリスト表示
4. 現在の倍率は青い背景でハイライト表示
5. 任意の倍率をクリックして選択
6. メニュー外をクリックすると自動で閉じる

## アーキテクチャ遵守

### 4-Layer Architecture
- **Logic (utils)**: `zoomLevels.ts` - 純粋関数による倍率計算
- **UI (components)**: `ZoomControl.tsx` - 表示と基本的なイベント処理
- **Bridge (hooks)**: なし（シンプルなため不要）
- **External Actions (services)**: なし（外部通信なし）

### Tailwind CSS Only
- すべてのスタイリングに Tailwind CSS のユーティリティクラスを使用
- インラインスタイル（`style` 属性）は一切使用せず
- カスタムCSSは不要

### 300行以内
- `zoomLevels.ts`: 約70行
- `ZoomControl.tsx`: 約130行

## 変更ファイル一覧

### 新規作成
- `src/utils/zoomLevels.ts`
- `src/components/common/ZoomControl.tsx`

### 修正
- `src/components/common/Navbar.tsx`

## 使用例

```typescript
// utils層での使用
const levels = getAvailableZoomLevels();
// => [0.5, 0.6, 0.7, ..., 3.0]

const next = getNextZoomLevel(1.0);
// => 1.1

const prev = getPreviousZoomLevel(1.0);
// => 0.9

// UI層での使用
<ZoomControl 
    zoom={zoom} 
    onZoomChange={setZoom} 
/>
```
