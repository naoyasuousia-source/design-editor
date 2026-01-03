import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ParagraphSettingsProps {
    target: HTMLElement;
    onApply: (property: keyof CSSStyleDeclaration, value: string, shouldUpdateStore?: boolean) => void;
    onUpdate: () => void;
}

const ParagraphSettings: React.FC<ParagraphSettingsProps> = ({
    target,
    onApply,
    onUpdate
}) => {
    const style = window.getComputedStyle(target);
    const textAlign = target.style.textAlign || style.textAlign;
    const writingMode = target.style.writingMode || style.writingMode;
    const letterSpacing = parseFloat(target.style.letterSpacing) || 0;
    const lineHeight = parseFloat(target.style.lineHeight) || 1.2;

    const isVertical = writingMode.includes('vertical');

    return (
        <div className="p-3 border-b border-white/10 flex flex-col gap-4 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Alignment & Direction</span>
                <div className="flex items-center gap-1">
                    <div className="flex bg-white/5 rounded p-0.5 border border-white/10">
                        {[
                            { value: 'left', icon: AlignLeft },
                            { value: 'center', icon: AlignCenter },
                            { value: 'right', icon: AlignRight },
                        ].map((item) => (
                            <button
                                key={item.value}
                                className={cn(
                                    "p-1.5 rounded transition-all",
                                    textAlign === item.value ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                                onClick={() => onApply('textAlign', item.value)}
                            >
                                <item.icon size={14} />
                            </button>
                        ))}
                    </div>

                    <button
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded border border-white/10 transition-all text-[10px]",
                            isVertical ? "bg-blue-500 text-white shadow-lg border-transparent" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                        onClick={() => {
                            const next = isVertical ? 'horizontal-tb' : 'vertical-rl';
                            onApply('writingMode', next);
                        }}
                    >
                        <Type size={14} className={cn(isVertical ? "rotate-0" : "rotate-0")} />
                        <span>{isVertical ? "Vertical" : "Horizontal"}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="text-gray-400">Letter Spacing</span>
                        <span className="text-gray-300 font-mono">{letterSpacing.toFixed(1)}px</span>
                    </div>
                    <input
                        type="range" min="-5" max="20" step="0.1"
                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        value={letterSpacing}
                        onInput={(e) => onApply('letterSpacing', `${(e.target as HTMLInputElement).value}px`, false)}
                        onMouseUp={onUpdate}
                    />
                </div>

                <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex justify-between items-center text-[9px]">
                        <span className="text-gray-400">Line Height</span>
                        <span className="text-gray-300 font-mono">{lineHeight.toFixed(2)}</span>
                    </div>
                    <input
                        type="range" min="0.5" max="3" step="0.05"
                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        value={lineHeight}
                        onInput={(e) => onApply('lineHeight', (e.target as HTMLInputElement).value, false)}
                        onMouseUp={onUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default ParagraphSettings;
