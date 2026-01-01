import React from 'react';
import { X, MousePointer2, Type, Layers, RefreshCw, Save, Image as ImageIcon } from 'lucide-react';

interface HintDialogProps {
    onClose: () => void;
}

const HintDialog: React.FC<HintDialogProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-sidebar/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="p-1 px-2 bg-blue-500 rounded text-xs">Help</span>
                        エディタの使い方
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] CustomScrollbar">
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/20 pb-1">基本操作</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <FeatureItem
                                icon={<MousePointer2 size={16} />}
                                title="要素の選択と移動"
                                description="要素をクリックして選択し、ドラッグで移動、枠線のハンドルでリサイズできます。"
                            />
                            <FeatureItem
                                icon={<Type size={16} />}
                                title="テキスト編集"
                                description="テキスト要素をダブルクリックすると直接編集モードになります。フォーカスを外すと保存されます。"
                            />
                            <FeatureItem
                                icon={<Layers size={16} />}
                                title="グループ化 (Shift + Click)"
                                description="Shiftキーを押しながらクリックで複数選択。上部のメニューからグループ化して、まとめて操作可能です。"
                            />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest border-b border-green-500/20 pb-1">AI 連携機能</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <FeatureItem
                                icon={<RefreshCw size={16} />}
                                title="リアルタイム同期"
                                description="AIがファイルを更新すると自動で検知。変更内容を比較検討し、承認・破棄を選択できます。"
                            />
                            <FeatureItem
                                icon={<ImageIcon size={16} />}
                                title="画像アセット管理"
                                description="左側のサイドバーから画像をドラッグ＆ドロップして、デザイン内の画像を素早く差し替えられます。"
                            />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest border-b border-yellow-500/20 pb-1">保存と書き出し</h3>
                        <FeatureItem
                            icon={<Save size={16} />}
                            title="クリーンなHTML出力"
                            description="エディタ専用の属性は保存時に自動除去。AIやブラウザに最適な純粋なHTMLを出力します。"
                        />
                    </section>
                </div>

                <div className="p-4 bg-sidebar/30 flex justify-center border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeatureItem: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="flex gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
        <div className="text-blue-400 group-hover:scale-110 transition-transform pt-0.5">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-bold text-gray-200 mb-1">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
    </div>
);

export default HintDialog;
