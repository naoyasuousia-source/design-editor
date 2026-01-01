import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

interface MetaMessageEditorProps {
    onClose: () => void;
}

const MetaMessageEditor: React.FC<MetaMessageEditorProps> = ({ onClose }) => {
    const { metaMessage, setMetaMessage } = useEditorStore();
    const [localMeta, setLocalMeta] = useState(metaMessage);

    const handleSave = () => {
        setMetaMessage(localMeta);
        onClose();
    };

    const updateArrayField = (field: 'requirements' | 'notes', index: number, value: string) => {
        const newArr = [...localMeta[field]];
        newArr[index] = value;
        setLocalMeta({ ...localMeta, [field]: newArr });
    };

    const addArrayItem = (field: 'requirements' | 'notes') => {
        setLocalMeta({ ...localMeta, [field]: [...localMeta[field], ''] });
    };

    const removeArrayItem = (field: 'requirements' | 'notes', index: number) => {
        const newArr = localMeta[field].filter((_, i) => i !== index);
        setLocalMeta({ ...localMeta, [field]: newArr });
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">AI 連携設定・設計意図</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 CustomScrollbar">
                    {/* 修正要求 */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI への修正要求</h3>
                            <button onClick={() => addArrayItem('requirements')} className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {localMeta.requirements.map((req, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={req}
                                        onChange={(e) => updateArrayField('requirements', i, e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none transition-colors"
                                        placeholder="例：フォントをより高級感のあるものに変更してください"
                                    />
                                    <button onClick={() => removeArrayItem('requirements', i)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {localMeta.requirements.length === 0 && (
                                <p className="text-xs text-gray-500 italic">要求事項はありません</p>
                            )}
                        </div>
                    </section>

                    {/* 設計コンセプト */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">デザインコンセプト</h3>
                        <textarea
                            value={localMeta.concept}
                            onChange={(e) => setLocalMeta({ ...localMeta, concept: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm h-24 focus:border-blue-500 outline-none transition-colors resize-none"
                            placeholder="例：ミニマルでモダン、信頼感のあるコーポレートデザイン"
                        />
                    </section>

                    {/* 配色定義 */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">カラーパレット</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Primary</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localMeta.colors.primary} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, primary: e.target.value } })} className="w-8 h-8 rounded bg-transparent" />
                                    <input type="text" value={localMeta.colors.primary} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, primary: e.target.value } })} className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-[10px] focus:border-blue-500 outline-none uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Secondary</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localMeta.colors.secondary} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, secondary: e.target.value } })} className="w-8 h-8 rounded bg-transparent" />
                                    <input type="text" value={localMeta.colors.secondary} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, secondary: e.target.value } })} className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-[10px] focus:border-blue-500 outline-none uppercase" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Accent</label>
                                <div className="flex gap-2">
                                    <input type="color" value={localMeta.colors.accent} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, accent: e.target.value } })} className="w-8 h-8 rounded bg-transparent" />
                                    <input type="text" value={localMeta.colors.accent} onChange={(e) => setLocalMeta({ ...localMeta, colors: { ...localMeta.colors, accent: e.target.value } })} className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-[10px] focus:border-blue-500 outline-none uppercase" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 備考・特記事項 */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI への備考</h3>
                        <textarea
                            value={localMeta.remarks}
                            onChange={(e) => setLocalMeta({ ...localMeta, remarks: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm h-20 focus:border-blue-500 outline-none transition-colors resize-none"
                            placeholder="AIへの補足説明など"
                        />
                    </section>
                </div>

                {/* フッター */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-sidebar/30">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                        設定を反映
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MetaMessageEditor;
