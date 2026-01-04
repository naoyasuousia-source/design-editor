import React, { useState } from 'react';
import { X, Plus, Trash2, Ban, Brain } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { cn } from '@/utils/cn';

interface MetaMessageEditorProps {
    onClose: () => void;
}

const MetaMessageEditor: React.FC<MetaMessageEditorProps> = ({ onClose }) => {
    const { metaMessage, setMetaMessage } = useEditorStore();
    const { handleOverwrite } = useFileSystem();
    const [localMeta, setLocalMeta] = useState(metaMessage);

    const handleSave = async () => {
        setMetaMessage(localMeta);
        // Zustandのstate更新は即時反映されるため、続けてhandleOverwriteを呼べる
        await handleOverwrite();
        onClose();
    };

    const updateArrayField = (field: 'fixedRules' | 'collaborativeRules', index: number, value: string) => {
        const newArr = [...localMeta[field]];
        newArr[index] = value;
        setLocalMeta({ ...localMeta, [field]: newArr });
    };

    const addArrayItem = (field: 'fixedRules' | 'collaborativeRules') => {
        setLocalMeta({ ...localMeta, [field]: [...localMeta[field], ''] });
    };

    const removeArrayItem = (field: 'fixedRules' | 'collaborativeRules', index: number) => {
        const newArr = localMeta[field].filter((_, i) => i !== index);
        setLocalMeta({ ...localMeta, [field]: newArr });
    };

    const updateColor = (type: 'main' | 'sub' | 'accent', value: string | 'none') => {
        setLocalMeta({
            ...localMeta,
            colors: {
                ...localMeta.colors,
                [type]: value
            }
        });
    };

    const renderColorPicker = (label: string, type: 'main' | 'sub' | 'accent') => {
        const value = localMeta.colors[type];
        const isNone = value === 'none';

        return (
            <div className="space-y-2">
                <label className="text-[11px] text-gray-400 font-medium block">{label}</label>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <input
                            type="color"
                            value={isNone ? '#000000' : value}
                            disabled={isNone}
                            onChange={(e) => updateColor(type, e.target.value)}
                            className={cn(
                                "w-10 h-10 rounded-lg cursor-pointer bg-white/5 border border-white/10 transition-all",
                                isNone && "opacity-20 cursor-not-allowed grayscale"
                            )}
                        />
                        {isNone && (
                            <Ban className="absolute inset-0 m-auto w-5 h-5 text-gray-500 pointer-events-none" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={isNone ? '選択なし' : value}
                        disabled={isNone}
                        onChange={(e) => updateColor(type, e.target.value)}
                        className={cn(
                            "flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none uppercase transition-all font-mono",
                            isNone && "text-gray-600 italic"
                        )}
                        placeholder="#HEX"
                    />
                </div>
                <button
                    onClick={() => updateColor(type, isNone ? '#3b82f6' : 'none')}
                    className={cn(
                        "text-[10px] px-2 py-1 rounded transition-colors",
                        isNone
                            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                >
                    {isNone ? 'カラーを選択する' : '選択なしに設定'}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">AIへの指示</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 CustomScrollbar">
                    {/* 固定ルール */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">固定ルール</h3>
                                <p className="text-[10px] text-gray-500 mt-1">※このルールはAIが勝手に変更することはありません</p>
                            </div>
                            <button onClick={() => addArrayItem('fixedRules')} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors text-xs font-medium">
                                <Plus className="w-3 h-3" />
                                追記
                            </button>
                        </div>
                        <div className="space-y-3">
                            {localMeta.fixedRules.map((rule, i) => (
                                <div key={i} className="flex gap-3 group">
                                    <div className="flex-1 relative">
                                        <input
                                            value={rule}
                                            onChange={(e) => updateArrayField('fixedRules', i, e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                            placeholder="例：ロゴの改変は禁止です"
                                        />
                                    </div>
                                    <button onClick={() => removeArrayItem('fixedRules', i)} className="p-2.5 text-gray-600 hover:text-red-400 transition-colors bg-white/5 rounded-xl opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {localMeta.fixedRules.length === 0 && (
                                <div className="py-4 px-4 border border-dashed border-white/5 rounded-xl text-center">
                                    <p className="text-xs text-gray-500 italic">固定ルールはありません</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 共同編集ルール */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">共同編集ルール</h3>
                            <button onClick={() => addArrayItem('collaborativeRules')} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors text-xs font-medium">
                                <Plus className="w-3 h-3" />
                                追記
                            </button>
                        </div>
                        <div className="space-y-3">
                            {localMeta.collaborativeRules.map((rule, i) => (
                                <div key={i} className="flex gap-3 group">
                                    <div className="flex-1 relative">
                                        <input
                                            value={rule}
                                            onChange={(e) => updateArrayField('collaborativeRules', i, e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                            placeholder="例：余白は大きく取ってください"
                                        />
                                    </div>
                                    <button onClick={() => removeArrayItem('collaborativeRules', i)} className="p-2.5 text-gray-600 hover:text-red-400 transition-colors bg-white/5 rounded-xl opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {localMeta.collaborativeRules.length === 0 && (
                                <div className="py-4 px-4 border border-dashed border-white/5 rounded-xl text-center">
                                    <p className="text-xs text-gray-500 italic">共同編集ルールはありません</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* デザインコンセプト */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">デザインコンセプト</h3>
                        <textarea
                            value={localMeta.designConcept}
                            onChange={(e) => setLocalMeta({ ...localMeta, designConcept: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm h-32 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-700"
                            placeholder="例：ミニマルでモダン、信頼感のあるコーポレートデザイン"
                        />
                    </section>

                    {/* カラーデザイン */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">カラーデザイン</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {renderColorPicker('メインカラー', 'main')}
                            {renderColorPicker('サブカラー', 'sub')}
                            {renderColorPicker('アクセントカラー', 'accent')}
                        </div>
                    </section>
                </div>

                {/* フッター */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        設定を反映
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MetaMessageEditor;
