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
        await handleOverwrite();
        onClose();
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

    const renderTextarea = (label: string, field: keyof Pick<typeof localMeta, 'fixedRules' | 'collaborativeRules' | 'designConcept'>, placeholder: string, subLabel?: string) => (
        <section className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">{label}</h3>
                    {subLabel && <span className="text-[9px] text-gray-500">{subLabel}</span>}
                </div>
                <span className={cn(
                    "text-[10px] tabular-nums",
                    localMeta[field].length >= 500 ? "text-red-400" : "text-gray-600"
                )}>
                    {localMeta[field].length}/500
                </span>
            </div>
            <textarea
                value={localMeta[field]}
                onChange={(e) => setLocalMeta({ ...localMeta, [field]: e.target.value.slice(0, 500) })}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm h-[100px] focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-700 CustomScrollbar overflow-y-auto"
                placeholder={placeholder}
            />
        </section>
    );

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
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">AIへの指示</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* コンテンツ - スクロール廃止しギャップを縮小 */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {renderTextarea('固定ルール', 'fixedRules', '例：ロゴの改変は禁止です。タイトルは必ず28px以上にしてください。', '※AI編集不可')}
                            {renderTextarea('共同編集ルール', 'collaborativeRules', '例：余白は大きく取ってください。明るい印象にしてください。')}
                        </div>
                        <div className="space-y-6">
                            {renderTextarea('デザインコンセプト', 'designConcept', '例：ミニマルでモダン、信頼感のあるコーポレートデザイン')}

                            {/* カラーデザイン */}
                            <section className="space-y-3">
                                <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">カラーデザイン</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {renderColorPicker('メイン', 'main')}
                                    {renderColorPicker('サブ', 'sub')}
                                    {renderColorPicker('アクセント', 'accent')}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                        設定を反映
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MetaMessageEditor;
