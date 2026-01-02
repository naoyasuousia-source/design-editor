import React from 'react';

interface RadiusPickerProps {
    target: HTMLElement;
    localRadius: number | null;
    setLocalRadius: (val: number | null) => void;
    onApply: (property: keyof CSSStyleDeclaration, value: string, shouldUpdateStore?: boolean) => void;
    onUpdate: () => void;
}

const RadiusPicker: React.FC<RadiusPickerProps> = ({
    target,
    localRadius,
    setLocalRadius,
    onApply,
    onUpdate
}) => {
    const currentRadius = localRadius ?? (parseInt(target.style.borderRadius) || 0);

    return (
        <div className="p-3 border-b border-white/10 flex flex-col gap-2 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Corner Radius</span>
                <div className="flex gap-1">
                    <button
                        className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] text-gray-300"
                        onClick={() => onApply('borderRadius', '0px')}
                    >Flat</button>
                    <button
                        className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[9px] text-gray-300"
                        onClick={() => onApply('borderRadius', '9999px')}
                    >Circle</button>
                </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
                <div className="flex justify-between text-[9px] text-gray-500">
                    <span>Radius</span>
                    <span>{currentRadius}px</span>
                </div>
                <input
                    type="range" min="0" max="100"
                    className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    value={currentRadius}
                    onInput={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        setLocalRadius(val);
                        onApply('borderRadius', `${val}px`, false);
                    }}
                    onMouseUp={() => {
                        onUpdate();
                        setLocalRadius(null);
                    }}
                    onTouchEnd={() => {
                        onUpdate();
                        setLocalRadius(null);
                    }}
                />
            </div>
        </div>
    );
};

export default RadiusPicker;
