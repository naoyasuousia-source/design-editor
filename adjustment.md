# ファイル名変更機能の実装

## 概要
新規作成時に、プロジェクトフォルダ選択後、自動的に `untitled-${timestamp}.html` というファイル名で保存される仕様から、**ユーザーにファイル名を入力させてから保存する**仕様に変更しました。

## 変更内容

### 1. `src/services/fileSystem.ts`
**変更箇所**: `createNewDesignFile` 関数

**変更前**:
```typescript
async createNewDesignFile(
    directoryHandle: FileSystemDirectoryHandle,
    template: string
): Promise<FileSystemFileHandle>
```
- 内部で `untitled-${timestamp}.html` を自動生成

**変更後**:
```typescript
async createNewDesignFile(
    directoryHandle: FileSystemDirectoryHandle,
    fileName: string,
    template: string
): Promise<FileSystemFileHandle>
```
- ファイル名をパラメータとして受け取る
- 自動命名ロジックを削除

### 2. `src/hooks/useFileSystem.ts`
**変更箇所**: `handleNew` 関数

**追加機能**:
1. プロジェクトフォルダ選択後、`prompt` でファイル名入力ダイアログを表示
2. デフォルト値として `untitled-${timestamp}.html` を提案
3. 拡張子の自動補完（`.html` がない場合は追加）
4. バリデーション:
   - 空のファイル名のチェック
   - `.html` のみのファイル名を拒否
   - キャンセル時の処理

**フロー**:
```
1. 比率を選択（呼び出し側で実施）
2. プロジェクトフォルダを選択
3. ファイル名を入力 ← 🆕 新規追加
4. フォルダに新規ファイルを作成
5. エディタに表示
```

## 動作仕様

### ファイル名入力ダイアログ
- **デフォルト値**: `untitled-1735840006123.html` (タイムスタンプ付き)
- **自動補完**: `.html` 拡張子が付いていない場合は自動追加
- **キャンセル**: ダイアログをキャンセルすると、ファイル作成を中止

### バリデーション
| 入力 | 結果 |
|------|------|
| `my-design` | `my-design.html` として作成 ✅ |
| `my-design.html` | `my-design.html` として作成 ✅ |
| (空欄) または (キャンセル) | 作成中止 ⛔ |
| `.html` のみ | エラーメッセージを表示 ⛔ |

## 影響範囲
- `src/services/fileSystem.ts` - createNewDesignFile 関数のシグネチャ変更
- `src/hooks/useFileSystem.ts` - handleNew 関数のロジック追加

## 注意点
- プロジェクト全体のビルドエラー（`src/components/features/Workspace.tsx` の既存エラー）は今回の変更とは無関係です
- 今回変更したファイルには型エラーはありません
