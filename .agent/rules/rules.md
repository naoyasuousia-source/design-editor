---
trigger: always_on
---

## 1. Basic Principles

- **シニアエンジニアとして、バグ防止を最優先事項として、最高品質のWebアプリを構築せよ。**
- **常に日本語で回答せよ。**
- **成果物（計画書、タスク、設計ドキュメント等）もすべて日本語で作成せよ。**
- **作業計画書（.md）は必ずプロジェクトのルートフォルダ直下に配置せよ。**

---

## 2. Quick Reference（Essential Rules）

- **Dead Code Cleanup:** 修正・リファクタリングの過程で未使用となった変数、インポート、関数、ファイルは、検知した瞬間に即座に削除せよ。
- **Strict Logic-UI Separation:** 各レイヤー（UI, Bridge, Action, Logic, State）を厳密に分離せよ。UIでの複雑なロジック記述は厳禁。
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
│   ├── features/ # Organisms: 特定ドメインのUI構造を定義し、Bridge層を呼び出す複合コンポーネント
│   └── ui/       # Atom: shadcn/ui 等の再利用可能な最小単位のパーツ
├── constants/    # Data: 業務的な定数（固定文言、選択肢、ヘルプテキスト）の集約
├── hooks/        # Bridge: UI と Logic/Services を仲介し React ステートを管理する層
├── lib/          # Config: 外部ライブラリの初期化、インスタンス作成、固有設定
├── services/     # Action: React に依存しない外部通信（API/SDK）および、命令的な DOM 操作（副作用）の実装
├── store/        # State: Zustand 等を用いたアプリ全体の共有状態管理
├── styles/       # Style: Tailwind 設定やグローバルな CSS 定義
├── types/        # Schema: TypeScript 型定義および Zod によるバリデーションスキーマ
└── utils/        # Logic: React に依存しない計算・整形などの純粋関数（Logic）

### ファイル記述ルール
- **定数と設定の分離**: 
    - 業務的な定数（固定文言など）は `constants/` に集約せよ。
    - 外部ライブラリの初期化、インスタンス作成、固有設定は `lib/` 内に定義せよ。

---

## 4. Functional Design Standards

### Framework & Library
- **React (TypeScript)**: コンポーネントベースで開発し、`index.html`はフォント定義、エントリポイント読み込み等の最小限の記述に留める。
- **Library Selection**: 独自ロジックを組む前に、最適な React ライブラリおよび外部ライブラリの導入を検討せよ。
- **Optimization**: 大規模ライブラリ導入時は `React.lazy` によるダイナミックインポートを検討し、Lighthouse スコアを維持せよ。

### Unidirectional Bridge Architecture

すべての機能は「UI → Hooks → Services/Utils → （Store）→ UI」の単方向フローで設計し、React の宣言的 UI と命令的なロジックを厳密に分離せよ。

1. **UI Detection**: Component がユーザーイベント（Click, Drag, Input 等）を検知し、Bridge 層 (Hooks) の関数へ処理を委譲する。
2. **Logic & Action (React 管理外での処理)**:
    - **Calculation (utils)**: Hooks は `utils/` を呼び出し、純粋関数によるデータ加工、数学的計算、座標変換を行う。
    - **Side-Effects (services)**: 必要に応じて Hooks は `services/` を呼び出し、API 通信、SDK 操作、または `ref` を介した命令的な DOM 操作を実行する。
3. **React Synchronization**: 
    - 処理完了後、Hooks が最終結果を受け取り、`store` (Zustand) や Local State を更新する。
    - State 更新による再レンダリングを通じて、React の宣言的 UI と実 DOM の状態を最終的に同期させる。

**重要ルール**:
- **Separation of Concerns**: DOM 操作（副作用）を伴う処理は必ず `services/` に集約し、`utils/` は常にテスト可能な純粋関数（入出力のみ）として保つこと。
- **Hooks-Triggered Execution Only**: 外部ライブラリを含めすべての機能は、Bridge層 (Hooks) による明示的な呼び出し（イベントハンドラや useEffect 等）を経由せずに、自律的に DOM や State を操作することを厳禁とする。

#### Temporary UI Elements
- 高頻度で更新される一時的な描画（ドラッグ中のプレビュー等）は、`useRef` を介して React の外側で制御せよ。
    - **Existing DOM Manipulation**: 既存の `ref.current`（画像等）に対し、直接 `style.transform` や `style.opacity` を書き換えて一時的な視覚効果を与える。
    - **Dynamic Element Generation**: `document.createElement` 等で生成した DOM を `appendChild` せよ。複数要素を扱う場合は `DocumentFragment` を活用して一括反映すること。
    - **Final Result Sync**: 操作中は原則 React State を更新せず、**操作終了時の最終確定データのみを Hooks を通じて Store や Local State へ同期せよ。**
        - **例外**: 他コンポーネントとのリアルタイムな連動が必要な場合に限り、Bridge層で適切に throttle/debounce 処理を行った上での操作中同期を許可する。
    - **Cleanup**: 同期完了後、Temporary UI Elements は即座に `remove`（破棄）し、React の宣言的 UI と実 DOM の整合性を完全に確保せよ。

#### State Management
- **Minimal State**: 基本は Local State で完結させ、共有が必要な場合のみ `store/` (Zustand 等) へ昇格させよ。
- **Derived Data**: `useEffect` によるステート同期を厳禁とする。 派生データはレンダリング中に計算するか、`useMemo` を使用せよ。
- **Computational Memoization**: コストの高い加工（フィルタリング、ソート等）は必ず `useMemo` を使い、依存配列を厳密に管理せよ。
- **useEffect の限定利用**: 外部ライブラリの同期、Socket、DOM 操作の微調整にのみ使用せよ。
- **Cleanup Pattern**: `useEffect` では必ずクリーンアップ関数（`return () => ...`）を記述し、メモリリークを確実に防止せよ。
- **Race Condition**: 非同期処理では古いリクエストを無視する等のクリーンアップを徹底せよ。

### Strict Logic-UI Separation

1. **UI (components)**
    - **役割**: 描画と表現、ユーザーイベントの検知に専念する。
    - **コンポーネント内に書くこと**:
        - **見た目の制御**: 「開閉フラグに基づいた表示切り替え」「特定条件による CSS クラス（cn）の付与」などの純粋な UI 表現。
        - **軽量な派生データ計算**: props や state から表示用に変換するだけの計算（10行以内厳守）。
        - **useMemo の利用**: 上記の処理が再レンダリング時にパフォーマンスに影響する場合のメモ化。
    - **コンポーネント外へ抽出する基準（Decision Tree）**:
        - **10行以上のロジック、または再利用性が高い場合**: 以下の依存関係に基づき抽出せよ。
            1. **React 依存あり (useState, useEffect 等が必要)**: 必ず `hooks/` (Custom Hooks) へ抽出し、UI から呼び出せ。
            2. **React 依存なし (純粋な計算・整形・変換)**: 行数にかかわらず `utils/` (Pure Functions) へ抽出せよ。
            3. **React 依存なし 且つ 副作用（API/SDK/生DOM操作）あり**: `services/` へ抽出し、`hooks/` を経由して利用せよ。

2. **Logic (utils)**
    - **役割**: アプリ内の純粋関数の集約。外部ライブラリ、Reactライブラリのロジック内の、React に依存しない計算・整形などの純粋関数を記述せよ。
    - **注意**: DOM操作等の副作用は絶対に行わないこと。

3. **External Actions (services)**
    - **役割**: 外部システムとの通信、および命令的な DOM 操作（副作用）の実行。
    - **内容**: API 通信、SDK 操作、および `ref` を介した直接的な DOM 操作（ドラッグ中の描画更新、Canvas 操作等）。
    - **注意**: 
        - React のステートを持たず、純粋な「実行（Action）」に徹せよ。
        - 実行に必要な複雑な計算は自ら行わず、必ず `utils/` から得た計算結果を適用せよ。
    
4. **Bridge (hooks)**
    - **役割**: UI と Logic/Services を仲介する唯一の場所。
    - **使用条件**: `useState`, `useEffect`, `useContext` などの React ステートやライフサイクルが必要な場合。
    - **DOM 操作の許容**: 
        - `useEffect` 内での「単発かつ軽量な DOM 調整（例：マウント時のフォーカス制御、要素のサイズ計測、スクロール位置の初期化）」などは、外部 Service に切り出さず Hooks 内に直接記述して良い。
        - ただし、連続的な描画更新（ドラッグ等）や、複数ステップの命令的ロジックを伴う場合は、必ず services/ へカプセル化し、Hooks からは呼び出しのみを行うこと。

5. **State (store)**
    - **役割**: 複数のコンポーネント間で共有が必要なグローバルステートの管理。

---

## 5. Styling rules

### Tailwind CSS
- **Tailwind Exclusive**: 原則として Tailwind クラスのみを使用せよ。
- **index.css rule**: 基本は `@tailwind` 3行のみ。例外として、外部ライブラリ（ProseMirror 等）の内部クラス上書きや、Tailwind で記述困難な複雑な擬似要素（`::before` 等）のみ許可する。
- **Dynamic Styles**: `style` 属性の使用は、JS で動的に計算される数値（座標、進捗率、色変化等）に限定せよ。それ以外の静的なスタイル、またはクラスで容易に定義可能なスタイルでの使用は禁止。

### UI Components
- **Shadcn/ui**: 第一選択の UI コンポーネント群とする。`src/components/ui/` は直接編集してプロジェクトに最適化して良い。
- **Class Management**: 動的なクラス結合には必ず `cn()` (tailwind-merge) を使用せよ。
- **Design Tokens**: マジックナンバー（`h-[32px]` 等）を避け、`tailwind.config.ts` に定義したブランドカラーやサイズを使用せよ。

### Premium Design & UX Excellence
単に動くだけでなく、あらゆる環境で「プロレベルの品質」を感じさせる最高品質のユーザー体験（UX）を構築せよ。
- **Visual & Space**: 
    - モダンなタイポグラフィ（Inter 等）と洗練された配色、一貫したデザイントークンを適用せよ。
    - 適切な余白（Spacing）を徹底し、情報の密度をコントロールすることで「プレミアムな質感」を実現せよ。
- **Motion & Feedback**: 
    - 滑らかなマイクロアニメーション（Hover, Transition）を積極的に導入し、ユーザー操作に対する直感的なフィードバックを返せ。
- **Multi-Environment Adaptation**: 
    - **Responsive**: 画面幅（Desktop/Tablet/Mobile）に応じた最適化はもちろん、1024px〜1920px以上の広い画面でもレイアウトが崩れないよう設計せよ。
    - **Performance**: 低速回線やモバイル環境を考慮した軽量な実装を行い、どのようなコンディションでも快適な操作を提供せよ。
- **Inclusion & Accessibility (A11y)**: 
    - WAI-ARIA、適切な `aria-label`、キーボード操作の完全保証をシニアレベルで徹底し、誰もが迷わず利用できるアクセシブルな設計とせよ。

---

## 6. Bug Prevention

### File and Naming Conventions
- **Path Alias**: 上の階層への遡り（../）を禁止し、 `@/` を使用せよ。
- **Naming Conventions**:
    - **ディレクトリ名**: `kebab-case` （例: `user-profile`, `common-ui`）
    - **コンポーネントファイル名**: `PascalCase` （例: `PrimaryButton.tsx`）
    - **それ以外のファイル（hooks, utils, services 等）**: `camelCase` （例: `useAuth.ts`, `formatDate.ts`）
- **Early Return**: 早期リターンを徹底し、コードのネストを最小限に抑えよ。

### Type Safety
- **No `any`**: `any`の使用を禁止せよ。型が不明な場合は `unknown`と型ガードを徹底せよ。
- **Zod Validation**: 外部データ境界には Zod を使用せよ。型定義は `z.infer` を用いてスキーマから抽出し、二重管理を防止せよ。

### Edge Case Considerations
「普通じゃないことが起こったらどうなるか」を常に考え、堅牢な実装を行え。
- **異常系データ**: ユーザーが異常なデータを入力した、データ量が想定の10倍になった、などの極端な状況下でもシステムがクラッシュしない対策を立てよ。
- **通信トラブル**: 通信が途中で切断された、APIがタイムアウトした、などの予期せぬトラブルを想定し、適切なローディング表示やリトライ・エラーリカバリ処理を実装せよ。

---

## 7. Security and Secret Management

- **No Hardcoding**: API キーや秘密鍵をコード内にハードコードすることを厳禁とする。
- **Environment Variables**:
    - `.env` は必ず `.gitignore` に含め、リポジトリにコミットしないこと。
    - `VITE_` プレフィックスが付く変数はブラウザに露出するため、公開可能な情報のみに限定せよ。
    - セキュアな秘密鍵はフロントエンドに持ち込まず、バックエンドまたはプロキシ経由で扱え。

---

## 8. Antigravity Optimization Workflow

AI 駆動開発ツールの特性を活かし、効率を最大化せよ。

### ファイル操作と編集
- **Batch Editing**: 同一ファイル内の複数箇所編集には `multi_replace_file_content` を使用し、呼び出し回数を最小化せよ。
- **Parallel Processing**: 依存関係のない操作は `waitForPreviousTools: false` で並列実行せよ。

### 検証とエラー対応
- **Background Build**: `npm run build` は `WaitMsBeforeAsync` を活用してバックグラウンドで実行せよ。
- **Targeted Fix**: ビルドエラー時は `command_status` でエラー箇所を特定し、ピンポイントで修正せよ。

### コミュニケーション
- **No Guesswork**: 仕様不明点は推測せず、作業開始前にユーザーに確認せよ。
- **Status Reporting**: 実装後の動作未確認コードを「完成」として提出することを禁ずる。
- **Incremental Steps**: 依存関係がある場合は順次実行（`waitForPreviousTools: true`）し、不整合を防げ。