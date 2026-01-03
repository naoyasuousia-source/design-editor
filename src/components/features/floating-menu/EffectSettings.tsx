import React, { useMemo } from 'react';

interface EffectSettingsProps {
    target: HTMLElement;
    targets: HTMLElement[];
    showShadowPalette: boolean;
    setShowShadowPalette: (show: boolean) => void;
    showTextBgPalette: boolean;
    setShowTextBgPalette: (show: boolean) => void;
    showStrokePalette: boolean;
    setShowStrokePalette: (show: boolean) => void;
    onApply: (property: keyof CSSStyleDeclaration, value: string, shouldUpdateStore?: boolean) => void;
    onUpdate: () => void;
    closeAllPanels: () => void;
}

const EffectSettings: React.FC<EffectSettingsProps> = ({
    target,
    targets,
    showShadowPalette,
    setShowShadowPalette,
    showTextBgPalette,
    setShowTextBgPalette,
    showStrokePalette,
    setShowStrokePalette,
    onApply,
    onUpdate,
    closeAllPanels
}) => {
    const style = window.getComputedStyle(target);

    // Shadow parsing
    const shadowValues = useMemo(() => {
        const value = target.style.textShadow || style.textShadow;
        if (!value || value === 'none') return { x: 0, y: 0, blur: 0, color: 'rgba(0,0,0,0.5)' };
        // Very basic parsing: "rgb(0, 0, 0) 2px 2px 2px" or "2px 2px 2px rgb(0, 0, 0)"
        const parts = value.split(' ');
        const color = value.match(/rgba?\(.*?\)|#[0-9a-fA-F]+/)?.[0] || '#000000';
        const nums = parts.filter(p => p.includes('px')).map(p => parseFloat(p));
        return {
            x: nums[0] || 0,
            y: nums[1] || 0,
            blur: nums[2] || 0,
            color
        };
    }, [target.style.textShadow, style.textShadow]);

    // Background parsing
    const bgValues = useMemo(() => {
        return {
            padding: parseFloat(target.style.padding) || 0,
            radius: parseFloat(target.style.borderRadius) || 0,
            color: target.style.backgroundColor || style.backgroundColor
        };
    }, [target.style.padding, target.style.borderRadius, target.style.backgroundColor, style.backgroundColor]);

    // Stroke parsing
    const strokeValues = useMemo(() => {
        const widthStr = target.style.getPropertyValue('-webkit-text-stroke-width') || style.getPropertyValue('-webkit-text-stroke-width') || '0px';
        const color = target.style.getPropertyValue('-webkit-text-stroke-color') || style.getPropertyValue('-webkit-text-stroke-color');
        const width = parseFloat(widthStr) || 0;
        const finalColor = color && color !== 'rgba(0, 0, 0, 0)' ? color : '#000000';

        return { width, color: finalColor };
    }, [target.style, style]);

    const updateShadow = (updates: Partial<typeof shadowValues>, shouldUpdateStore = false) => {
        const v = { ...shadowValues, ...updates };
        onApply('textShadow', `${v.x}px ${v.y}px ${v.blur}px ${v.color}`, shouldUpdateStore);
    };

    const updateBackground = (updates: Partial<typeof bgValues>, shouldUpdateStore = false) => {
        const v = { ...bgValues, ...updates };
        if (v.padding > 0 && style.display !== 'inline-block') {
            onApply('display' as keyof CSSStyleDeclaration, 'inline-block', false);
        }
        if (updates.padding !== undefined) onApply('padding', `${v.padding}px`, shouldUpdateStore);
        if (updates.radius !== undefined) onApply('borderRadius', `${v.radius}px`, shouldUpdateStore);
        if (updates.color !== undefined) onApply('backgroundColor', v.color, shouldUpdateStore);
    };

    const updateStroke = (updates: Partial<typeof strokeValues>, shouldUpdateStore = false) => {
        const v = { ...strokeValues, ...updates };

        targets.forEach(el => {
            el.style.setProperty('-webkit-text-stroke-width', `${v.width}px`);
            el.style.setProperty('-webkit-text-stroke-color', v.color);
            if (v.width > 0) {
                el.style.setProperty('paint-order', 'stroke fill');
            } else {
                el.style.setProperty('paint-order', 'normal');
            }
        });

        if (shouldUpdateStore) onUpdate();
    };

    return (
        <div className="p-3 border-b border-white/10 flex flex-col gap-4 bg-white/5 animate-in slide-in-from-bottom-1 duration-200 overflow-y-auto max-h-[300px] CustomScrollbar">
            {/* Shadow Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Shadow Effect</span>
                    <button
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: shadowValues.color }}
                        onClick={() => {
                            const next = !showShadowPalette;
                            closeAllPanels();
                            setShowShadowPalette(next);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2 px-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Offset & Direction</span>
                            <span>{shadowValues.x}px</span>
                        </div>
                        <input
                            type="range" min="0" max="20" step="1"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={shadowValues.x}
                            onInput={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                updateShadow({ x: val, y: val });
                            }}
                            onMouseUp={onUpdate}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Blur</span>
                            <span>{shadowValues.blur}px</span>
                        </div>
                        <input
                            type="range" min="0" max="20" step="1"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={shadowValues.blur}
                            onInput={(e) => updateShadow({ blur: parseFloat((e.target as HTMLInputElement).value) })}
                            onMouseUp={onUpdate}
                        />
                    </div>
                </div>
            </div>

            {/* Background Section */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Background</span>
                    <button
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: bgValues.color }}
                        onClick={() => {
                            const next = !showTextBgPalette;
                            closeAllPanels();
                            setShowTextBgPalette(next);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2 px-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Spread (Padding)</span>
                            <span>{bgValues.padding}px</span>
                        </div>
                        <input
                            type="range" min="0" max="50" step="1"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={bgValues.padding}
                            onInput={(e) => updateBackground({ padding: parseFloat((e.target as HTMLInputElement).value) })}
                            onMouseUp={onUpdate}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Corner Radius</span>
                            <span>{bgValues.radius}px</span>
                        </div>
                        <input
                            type="range" min="0" max="50" step="1"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={bgValues.radius}
                            onInput={(e) => updateBackground({ radius: parseFloat((e.target as HTMLInputElement).value) })}
                            onMouseUp={onUpdate}
                        />
                    </div>
                </div>
            </div>

            {/* Stroke Section */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Outline / Stroke</span>
                    <button
                        className="w-4 h-4 rounded-sm border border-white/20"
                        style={{ backgroundColor: strokeValues.color }}
                        onClick={() => {
                            const next = !showStrokePalette;
                            closeAllPanels();
                            setShowStrokePalette(next);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-2 px-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Width</span>
                            <span>{strokeValues.width}px</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="0.5"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={strokeValues.width}
                            onInput={(e) => updateStroke({ width: parseFloat((e.target as HTMLInputElement).value) })}
                            onMouseUp={onUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EffectSettings;
