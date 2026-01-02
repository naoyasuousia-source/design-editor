import React from 'react';
import { Bold, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { EDITOR_FONTS } from '@/constants/editor';

const PRESET_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80, 96, 128];

interface TextSettingsProps {
    target: HTMLElement;
    showSizeDropdown: boolean;
    setShowSizeDropdown: (show: boolean) => void;
    showColorPalette: boolean;
    setShowColorPalette: (show: boolean) => void;
    onApply: (property: keyof CSSStyleDeclaration, value: string) => void;
    onToggleBold: () => void;
}

const TextSettings: React.FC<TextSettingsProps> = ({
    target,
    showSizeDropdown,
    setShowSizeDropdown,
    showColorPalette,
    setShowColorPalette,
    onApply,
    onToggleBold
}) => {
    const currentFontSize = Math.round(parseFloat(window.getComputedStyle(target).fontSize) || 16);
    const fontWeight = window.getComputedStyle(target).fontWeight;
    const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 700;
    const currentColor = window.getComputedStyle(target).color;

    return (
        <>
            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                <select
                    className="bg-transparent text-[10px] text-gray-300 hover:text-white outline-none cursor-pointer max-w-[80px] py-1"
                    value={target.style.fontFamily.replace(/['"]/g, '')}
                    onChange={(e) => onApply('fontFamily', e.target.value)}
                >
                    {EDITOR_FONTS.map(f => (
                        <option key={f.value} value={f.value} className="bg-[#1a1a1a] text-white text-[10px]">{f.label}</option>
                    ))}
                </select>
                <div className="relative flex items-center bg-white/5 rounded border border-white/10 hover:border-white/20 ml-1 group">
                    <input
                        type="text"
                        className="w-10 bg-transparent text-[10px] text-center text-gray-300 hover:text-white outline-none py-1"
                        value={currentFontSize}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val) onApply('fontSize', `${val}px`);
                        }}
                    />
                    <div
                        className="relative h-6 flex items-center border-l border-white/10 px-0.5 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                    >
                        <ChevronDown size={10} className={cn("text-gray-500 transition-transform", showSizeDropdown && "rotate-180")} />

                        {showSizeDropdown && (
                            <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl py-1 z-[110] min-w-[60px] max-h-48 overflow-y-auto CustomScrollbar">
                                {PRESET_FONT_SIZES.map(s => (
                                    <div
                                        key={s}
                                        className="px-3 py-1 text-[10px] text-white hover:bg-blue-500 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onApply('fontSize', `${s}px`);
                                        }}
                                    >
                                        {s}px
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                <button
                    className={cn(
                        "p-1.5 rounded transition-all",
                        isBold ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                    onClick={onToggleBold}
                >
                    <Bold size={14} />
                </button>
            </div>
            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                <button
                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                    style={{ backgroundColor: currentColor }}
                    onClick={() => setShowColorPalette(!showColorPalette)}
                >
                    {showColorPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                </button>
            </div>
        </>
    );
};

export default TextSettings;
