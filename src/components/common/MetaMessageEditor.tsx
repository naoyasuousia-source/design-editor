import React, { useState } from 'react';
import { X, Plus, Trash2, Ban, Brain } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { cn } from '@/utils/cn';

interface MetaMessageEditorProps {
    onClose: () => void;
}

const COLOR_KITS: Record<string, { label: string; main: string; sub: string; accent: string }> = {
    custom: { label: 'カスタム', main: '#3b82f6', sub: '#1f2937', accent: '#fbbf24' },
    business: { label: 'ビジネス', main: '#1a365d', sub: '#f8fafc', accent: '#3b82f6' },
    natural: { label: 'ナチュラル', main: '#3f6212', sub: '#fefce8', accent: '#84cc16' },
    pop: { label: 'ポップ', main: '#db2777', sub: '#ffffff', accent: '#facc15' },
    chic: { label: 'シック', main: '#1e293b', sub: '#f1f5f9', accent: '#94a3b8' },
    dark: { label: 'ダーク', main: '#0f172a', sub: '#1e293b', accent: '#38bdf8' },
    warm: { label: 'ウォーム', main: '#9a3412', sub: '#fff7ed', accent: '#fb923c' },
    cool: { label: 'クール', main: '#1e3a8a', sub: '#eff6ff', accent: '#60a5fa' },
    elegant: { label: 'エレガント', main: '#581c87', sub: '#faf5ff', accent: '#a855f7' },
    cute: { label: 'キュート', main: '#be185d', sub: '#fff1f2', accent: '#f472b6' },
    earth: { label: 'アース', main: '#166534', sub: '#f0fdf4', accent: '#b45309' },
    japanese: { label: '和', main: '#7f1d1d', sub: '#fff5f5', accent: '#d97706' },
};

const MetaMessageEditor: React.FC<MetaMessageEditorProps> = ({ onClose }) => {
    const { metaMessage, setMetaMessage } = useEditorStore();
    const { handleOverwrite } = useFileSystem();
    const [localMeta, setLocalMeta] = useState(metaMessage);

    const isCustom = localMeta.colorKit === 'custom' || !localMeta.colorKit;

    const handleSave = async () => {
        setMetaMessage(localMeta);
        await handleOverwrite();
        onClose();
    };

    const updateColor = (type: 'main' | 'sub' | 'accent', value: string | 'none') => {
        if (!isCustom) return;
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
                    <h3 className="text-[14px] font-bold text-blue-400 uppercase tracking-widest">{label}</h3>
                    {subLabel && <span className="text-[10px] text-gray-500 mt-1">{subLabel}</span>}
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm h-[82px] focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-700 CustomScrollbar overflow-y-auto font-medium"
                placeholder={placeholder}
            />
        </section>
    );

    const renderColorPicker = (label: string, type: 'main' | 'sub' | 'accent') => {
        const value = localMeta.colors[type];
        const isNone = value === 'none';
        const disabled = !isCustom || isNone;

        return (
            <div className="space-y-1.5 flex-1 min-w-0">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block ml-1">{label}</label>
                <div className="flex items-center gap-2">
                    <div className="relative group shrink-0">
                        <input
                            type="color"
                            value={isNone ? '#000000' : value}
                            disabled={disabled}
                            onChange={(e) => updateColor(type, e.target.value)}
                            className={cn(
                                "w-9 h-9 rounded-lg cursor-pointer bg-white/5 border border-white/10 transition-all",
                                isNone && "opacity-20 grayscale",
                                !isCustom && "cursor-not-allowed"
                            )}
                        />
                        {isNone && (
                            <Ban className="absolute inset-0 m-auto w-4 h-4 text-gray-500 pointer-events-none" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={isNone ? '選択なし' : value}
                        disabled={disabled}
                        onChange={(e) => updateColor(type, e.target.value)}
                        className={cn(
                            "w-full max-w-[90px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-500 outline-none uppercase transition-all font-mono",
                            isNone && "text-gray-600 italic",
                            !isCustom && "cursor-not-allowed"
                        )}
                        placeholder="#HEX"
                    />
                </div>
                {isCustom && (
                    <button
                        onClick={() => updateColor(type, isNone ? '#3b82f6' : 'none')}
                        className={cn(
                            "text-[10px] px-2 py-0.5 rounded transition-colors w-fit",
                            isNone
                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {isNone ? '選択する' : '選択なし'}
                    </button>
                )}
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

                {/* コンテンツ */}
                <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] CustomScrollbar">
                    <div className="space-y-4 max-w-xl mx-auto">
                        {renderTextarea('固定ルール', 'fixedRules', '例：ロゴの改変は禁止です。タイトルは必ず28px以上にしてください。', '※AI編集不可')}
                        {renderTextarea('共同編集ルール', 'collaborativeRules', '例：余白は大きく取ってください。明るい印象にしてください。')}
                        {renderTextarea('デザインコンセプト', 'designConcept', '例：ミニマルでモダン、信頼感のあるコーポレートデザイン')}

                        {/* カラーデザイン */}
                        <section className="space-y-5 pt-4 border-t border-white/5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[14px] font-bold text-blue-400 uppercase tracking-widest">カラーデザイン</h3>
                                </div>

                                <div className="flex gap-4">
                                    {renderColorPicker('メイン', 'main')}
                                    {renderColorPicker('サブ', 'sub')}
                                    {renderColorPicker('アクセント', 'accent')}
                                </div>

                                <div className="space-y-2 pt-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">カラーデザインキット</h4>
                                    <div className="grid grid-cols-6 gap-2">
                                        {Object.entries(COLOR_KITS).map(([key, kit]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setLocalMeta({
                                                        ...localMeta,
                                                        colorKit: key as any,
                                                        colors: key === 'custom' ? localMeta.colors : { main: kit.main, sub: kit.sub, accent: kit.accent }
                                                    });
                                                }}
                                                className={cn(
                                                    "px-2 py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1.5 border",
                                                    localMeta.colorKit === key || (key === 'custom' && !localMeta.colorKit)
                                                        ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/10"
                                                        : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300"
                                                )}
                                            >
                                                <div className="flex -space-x-1 shrink-0">
                                                    <div className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.main }} />
                                                    <div className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.sub }} />
                                                    <div className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: kit.accent }} />
                                                </div>
                                                <span className="truncate w-full text-center">{kit.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
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
