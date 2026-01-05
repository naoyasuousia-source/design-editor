## 1. Basic Principles

- **シニアエンジニアとして、バグ防止を最優先事項として、最高品質のWebアプリを構築せよ。**
- **常に日本語で回答せよ。**
- **成果物（計画書、タスク、設計ドキュメント等）もすべて日本語で作成せよ。**
- **作業計画書（.md）は必ずプロジェクトのルートフォルダ直下に配置せよ。**

---

## 2. Quick Reference（Essential Rules）

- **Dead Code Cleanup:** 修正・リファクタリングの過程で未使用となった変数、インポート、関数、ファイルは、検知した瞬間に即座に削除せよ。
- **4-Layer Architecture:** UI, Hooks, Services, Utils を厳密に分離せよ。UI での DOM 操作や複雑なロジック記述は厳禁。
- **Styling:** 原則 **Tailwind CSS のみ**を使用せよ。インラインスタイル（`style` 属性）は動的に計算される数値を除いて禁止。
- **300-Line Limit:** 1ファイル300行以内を厳守せよ。
- **No Placeholders:** `// TODO` や `// 実装予定` 等を残さず、全ての関数を完全に実装せよ。
- **No Unauthorized Browser Check:** ユーザーの明示的な指示なく、勝手にブラウザ確認作業（`npm run dev` によるローカルサーバー起動やブラウザ操作）を開始しないこと（時間の浪費を避けるため）。

---

## 3. Directory Structure

`src/` 直下へのファイル作成を禁じ、以下の構造を遵守せよ。

src/
├── app/          # Core: エントリポイント、ルーティング、グローバルプロバイダーの集約
├── components/   # UI: 描画とユーザーイベント検知に専念するコンポーネント群
│   ├── common/   # Molecules: 複数機能で横断利用する共通レイアウトやパーツ
│   ├── features/ # Organisms: 特定ドメインのビジネスルールを含む複合コンポーネント
│   └── ui/       # Atom: shadcn/ui 等の再利用可能な最小単位のパーツ
├── constants/    # Data: 業務的な定数（固定文言、選択肢、ヘルプテキスト）の集約
├── hooks/        # Bridge: UI と Logic/Services を仲介し React ステートを管理する層
├── lib/          # Config: 外部ライブラリの初期化、インスタンス作成、固有設定
├── services/     # API: React に依存しない外部通信（Promise）や SDK 操作の実装
├── store/        # State: Zustand 等を用いたアプリ全体の共有状態管理
├── styles/       # Style: Tailwind 設定やグローバルな CSS 定義
├── types/        # Schema: TypeScript 型定義および Zod によるバリデーションスキーマ
└── utils/        # Logic: React に依存しない計算・整形などの純粋関数（Logic）

### ファイル記述ルール
- **定数と設定の分離**: 
    - 業務的な定数（固定文言など）は `constants/` に集約せよ。
    - ライブラリ固有の設定値（初期化オプション等）は `lib/` 内に定義せよ。
---

## 4. Functional Design Standards

### Framework & Library
- **React (TypeScript)**: コンポーネントベースで開発し、`index.html`はフォント定義、エントリポイント読み込み等の最小限の記述に留める。
- **Library Selection**: 独自ロジックを組む前に、最適な React ライブラリおよび外部ライブラリの導入を検討せよ。
- **Optimization**: 大規模ライブラリ導入時は `React.lazy` によるダイナミックインポートを検討し、Lighthouse スコアを維持せよ。

### Unidirectional Data Flow via Bridge Layer

#### 🔄 Standard Data Flow Pipeline
AI は常に以下のサイクルに従ってコードを生成せよ。
1. **UI Detection**: Component がユーザーイベント（Click, Drag, Input等）を検知。
2. **Hooks Call**: Component は即座に Bridge層 (Hooks) の関数を呼び出し、入力を委譲する。
3. **External Logic**: Hooks は Logic層 (Utils/Services) を起動し、React の管理外で計算や非同期処理を実行。
4. **React Synchronization**: 処理完了後、Hooks が結果を受け取り、`store` (Zustand) や Local State を更新することで React のレンダリングを同期する。

#### 💾 ステート管理
- **Minimal State**: 基本は Local State で完結させ、共有が必要な場合のみ `store/` (Zustand 等) へ昇格させよ。
- **Derived Data**: `useEffect` によるステート同期を厳禁とする。 派生データはレンダリング中に計算するか、`useMemo` を使用せよ。
- **Computational Memoization**: コストの高い加工（フィルタリング、ソート等）は必ず `useMemo` を使い、依存配列を厳密に管理せよ。

#### ⚙️ 副作用と非同期処理の安全性
- **useEffect の限定利用**: 外部ライブラリの同期、Socket、DOM 操作の微調整にのみ使用せよ。
- **Cleanup Pattern**: `useEffect` では必ずクリーンアップ関数（`return () => ...`）を記述し、メモリリークを確実に防止せよ。
- **Race Condition**: 非同期処理では古いリクエストを無視する等のクリーンアップを徹底せよ。
- **Ref Safety**: `useRef` による直接的な DOM 操作は、操作中（ドラッグ中等）のパフォーマンス確保に限定し、React の宣言的 UI と衝突しないよう最小限に留めよ。

### Strict Logic-UI Separation

UI層とロジック層を完全に隔離し、AIによる自動生成時でも保守性と型安全性を担保する。

1. **Logic (utils / lib)**
    - **utils**: React に依存しない純粋関数。計算、フォーマット、変換など。
    - **lib**: 外部ライブラリ（Tiptap, Supabase 等）の**初期化、インスタンス作成、ライブラリ固有の設定**。
2. **External Actions (services)**
    - API 通信、SDK の直接操作、外部データとのやり取り。
    - React のステートを持たず、純粋な非同期処理（Promise の返却）に徹する。
3. **Bridge (hooks)**
    - **役割**: UI と Logic/Services を仲介する唯一の場所。
    - **使用条件**: `useState`, `useEffect`, `useContext` などの React ステートやライフサイクルが必要な場合。
    - **Bridge層 (Hooks) へ逃がすべきこと (Domain Logic)**:
        - **ビジネスルールの適用**: 「体温が37.5度以上ならアラートフラグを立てる」といった、アプリの仕様に関わる判定。
        - **複数の State を跨ぐ計算**: 2つ以上のステートを組み合わせて新しいデータを作る場合。
        - **外部依存**: APIからの取得データ（Services）を画面用に整形する処理。
    - **重要**: 外部ライブラリや独自ロジックが hooks を経由せず、直接 DOM 操作をすることを禁止する。
4. **UI (components)**
    - **役割**: 描画と表現、ユーザーイベントの検知に専念する。
    - **コンポーネント内に書いても良いこと (UI Logic)**:
        - **見た目の制御**: 「開閉フラグに基づいて表示文言を切り替える」「特定条件でCSSクラスを付与する」など。
        - **軽量な派生データ計算**: 渡された `props` や `state` から、表示に必要な形に変換する程度の pure な計算（10行以内目安）。
        - **useMemo の利用**: 上記の処理が再レンダリングで重くなる場合のメモ化。
    - **プレミアムなデザイン実装**: 単に動くだけでなく、適切な余白、洗練された配色、滑らかなマイクロアニメーション（Hover, Transition）を積極的に導入し、プレミアムなユーザー体験（UX）を構築せよ。
    - **禁止事項**: 複雑なビジネスロジックの混入、直接的な API 通信ロジックの記述。これらの Domain Logic は必ず Hooks へ委ねること。

---

## 4. バグ防止
### ファイルと命名規則
- **Path Alias**: すべて `@/` を使用せよ。相対パス（`../`）は禁止。
- **Naming Conventions**:
    - **ディレクトリ名**: `kebab-case` （例: `user-profile`, `common-ui`）
    - **コンポーネントファイル名**: `PascalCase` （例: `PrimaryButton.tsx`）
    - **それ以外のファイル（hooks, utils, services 等）**: `camelCase` （例: `useAuth.ts`, `formatDate.ts`）
- **Early Return**: 早期リターンを徹底し、コードのネストを最小限に抑えよ。

### 型安全の徹底
- **No `any`**: `any` の使用を禁止。`unknown` と型ガードを活用せよ。
- **Zod Validation**: API レスポンス等の外部データ境界には必ず **Zod** を使用し、バリデーションと型定義をセットでカプセル化せよ。

### エッジケース想定 (Edge Case Considerations)
「普通じゃないことが起こったらどうなるか」を常に考え、堅牢な実装を行え。
- **異常系データ**: ユーザーが異常なデータを入力した、データ量が想定の10倍になった、などの極端な状況下でもシステムがクラッシュしない対策を立てよ。
- **通信トラブル**: 通信が途中で切断された、APIがタイムアウトした、などの予期せぬトラブルを想定し、適切なローディング表示やリトライ・エラーリカバリ処理を実装せよ。

---

## 5. 🎨 スタイリングと UI 標準

### Tailwind CSS の運用
- **Tailwind Exclusive**: 原則として Tailwind クラスのみを使用せよ。
- **index.css の役割**: 基本は `@tailwind` 3行のみ。例外として、外部ライブラリ（ProseMirror 等）の内部クラス上書きや、Tailwind で記述困難な複雑な擬似要素（`::before` 等）のみ許可する。
- **Dynamic Styles**: `style` 属性の使用は、JS で動的に計算される数値（座標、進捗率、色変化等）に限定せよ。それ以外の静的なスタイル、またはクラスで容易に定義可能なスタイルでの使用は禁止。
- **Design Excellence**: モダンなタイポグラフィ（Inter, Roboto 等）、一貫したデザイントークン、アクセシビリティ（WAI-ARIA）を融合させ、「プロレベルの品質」を維持せよ。

### UI ライブラリとコンポーネント
- **Shadcn/ui**: 第一選択の UI コンポーネント群とする。`src/components/ui/` は直接編集してプロジェクトに最適化して良い。
- **Class Management**: 動的なクラス結合には必ず `cn()` (tailwind-merge) を使用せよ。
- **Design Tokens**: マジックナンバー（`h-[32px]` 等）を避け、`tailwind.config.ts` に定義したブランドカラーやサイズを使用せよ。

### レスポンシブとアクセシビリティ
- **Multi-Environment Adaptation**: 画面幅（Desktop/Tablet/Mobile）だけでなく、OS、ブラウザ、通信速度などの「場合分け」を徹底せよ。1024px〜1920px以上の変化への追従はもちろん、低速回線やモバイル環境下でも最適なUI/UXを提供できるよう設計せよ。
- **Accessibility (A11y)**: WAI-ARIA、適切な `aria-label`、キーボード操作の保証をシニアレベルで行え。

---

## 7. 🔐 セキュリティとシークレット管理

- **No Hardcoding**: API キーや秘密鍵をコード内にハードコードすることを厳禁とする。
- **Environment Variables**:
    - `.env` は必ず `.gitignore` に含め、リポジトリにコミットしないこと。
    - `VITE_` プレフィックスが付く変数はブラウザに露出するため、公開可能な情報のみに限定せよ。
    - セキュアな秘密鍵はフロントエンドに持ち込まず、バックエンドまたはプロキシ経由で扱え。

---

## 8. 🚀 Antigravity 最適化ワークフロー

AI 駆動開発ツールの特性を活かし、効率を最大化せよ。

### ファイル操作と編集
- **Batch Editing**: 同一ファイル内の複数箇所編集には `multi_replace_file_content` を使用し、呼び出し回数を最小化せよ。
- **Parallel Processing**: 依存関係のない操作は `waitForPreviousTools: false` で並列実行せよ。

### 検証とエラー対応
- **Background Build**: `npm run build` は `WaitMsBeforeAsync` を活用してバックグラウンドで実行せよ。
- **Targeted Fix**: ビルドエラー時は `command_status` でエラー箇所を特定し、ピンポイントで修正せよ。
- **Tool call retry**: エラー時はメッセージを精読し、1回のみリトライせよ。3回失敗した場合はユーザーに報告せよ。

### コミュニケーション
- **No Guesswork**: 仕様不明点は推測せず、作業開始前にユーザーに確認せよ。
- **Status Reporting**: 実装後の動作未確認コードを「完成」として提出することを禁ずる。
- **Incremental Steps**: 依存関係がある場合は順次実行（`waitForPreviousTools: true`）し、不整合を防げ。