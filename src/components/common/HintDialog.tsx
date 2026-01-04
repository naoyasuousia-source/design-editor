import React, { useState } from 'react';
import { X, FolderOpen, Zap, Edit3, Save, Copy, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HintDialogProps {
    onClose: () => void;
}

const HintDialog: React.FC<HintDialogProps> = ({ onClose }) => {
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [copied, setCopied] = useState(false);

    const workflowText = `## ステップ1
- implementation_plan.mdを確認し、進捗を確認する。

## ステップ2
- requirement.mdとrules.mdを確認する。
- requirement.mdとrules.mdに厳密に従って、タスクを考える。

## ステップ3
- rules.mdに従って、実際にコーディングを行う。

## ステップ4
- 作業終了後、implementation_plan.mdのチェックリストを更新する。
- implementation_plan.mdを必要に応じて更新する。
- 今後の方針について、ユーザーに対して質問がある場合は質問する。`;

    const handleCopy = () => {
        navigator.clipboard.writeText(workflowText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-gradient-to-r from-[#1a1a1a] to-[#121212]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">AI-Link Design ガイド</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">Editor Usage & Workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 CustomScrollbar">
                    {/* Step 1 */}
                    <StepItem
                        number="01"
                        icon={<FolderOpen className="w-5 h-5" />}
                        title="AI-Link Design の準備"
                        description="「新規作成」から保存先フォルダを指定して開始します。Antigravity でそのフォルダを開き、Customizationメニューで以下のワークフローを設定します。"
                        color="bg-blue-500"
                    >
                        <div className="mt-4">
                            <button
                                onClick={() => setShowWorkflow(!showWorkflow)}
                                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 group"
                            >
                                <Terminal className="w-3.5 h-3.5" />
                                <span>AI 連携用ワークフロープロンプト</span>
                                {showWorkflow ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />}
                            </button>

                            {showWorkflow && (
                                <div className="mt-3 relative group animate-in slide-in-from-top-2 duration-300">
                                    <div className="absolute top-3 right-3 z-10">
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 flex items-center gap-2 group/btn"
                                        >
                                            {copied ? (
                                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-[10px] text-green-400 font-bold">COPIED</span></>
                                            ) : (
                                                <><Copy className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-white" /><span className="text-[10px] text-gray-400 group-hover/btn:text-white font-bold uppercase">Copy</span></>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="bg-black/50 border border-white/5 rounded-xl p-5 pt-12 overflow-x-auto text-[11px] leading-relaxed font-mono text-gray-300 CustomScrollbar transition-all group-hover:border-blue-500/30">
                                        {workflowText}
                                    </pre>
                                    <div className="mt-2 text-[10px] text-gray-500 italic">
                                        ※ 上記をコピーして Antigravity の workflow 設定に貼り付けてください。
                                    </div>
                                </div>
                            )}
                        </div>
                    </StepItem>

                    {/* Step 2 */}
                    <StepItem
                        number="02"
                        icon={<Zap className="w-5 h-5" />}
                        title="AI によるデザイン生成"
                        description="Antigravityでワークフローを指定し、デザイン指示を送ります。AI が生成した変更内容はエディタに同期され、「承認」または「破棄」を選択します。"
                        color="bg-purple-500"
                    />

                    {/* Step 3 */}
                    <StepItem
                        number="03"
                        icon={<Edit3 className="w-5 h-5" />}
                        title="エディタでの編集"
                        description="生成されたデザインをベースに、要素の移動・削除・編集を行い、直感的に仕上げていきます。imagesフォルダ内の画像やテキストボックスの新規挿入も可能です。"
                        color="bg-emerald-500"
                    />

                    {/* Step 4 */}
                    <StepItem
                        number="04"
                        icon={<Save className="w-5 h-5" />}
                        title="デザインの保存"
                        description="2,3を繰り返し、デザインが完成したら「画像として保存」を実行します。"
                        color="bg-orange-500"
                    />
                </div>
            </div>
        </div>
    );
};

interface StepItemProps {
    number: string;
    icon: React.ReactElement;
    title: string;
    description: string;
    children?: React.ReactNode;
    color: string;
}

const StepItem: React.FC<StepItemProps> = ({ number, icon, title, description, children, color }) => (
    <div className="relative pl-12 group">
        {/* Timeline line */}
        <div className="absolute left-6 top-10 bottom-[-32px] w-[1px] bg-gradient-to-b from-white/10 to-transparent group-last:hidden" />

        {/* Number badge */}
        <div className={cn("absolute left-0 top-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", color, "bg-opacity-10 text-white font-mono text-xs font-bold ring-1 ring-inset ring-white/10 shadow-lg")}>
            <div className={cn("absolute inset-0 rounded-xl opacity-20", color)} />
            <span className="relative z-10">{number}</span>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className={cn("inline-block p-1 rounded-md mb-1", color, "bg-opacity-20 text-white transition-transform group-hover:rotate-12")}>
                    {React.cloneElement(icon, { size: 14 } as any)}
                </span>
                <h3 className="text-[15px] font-bold text-gray-100 tracking-tight group-hover:text-white transition-colors">
                    {title}
                </h3>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed font-medium">
                {description}
            </p>
            {children}
        </div>
    </div>
);

export default HintDialog;
