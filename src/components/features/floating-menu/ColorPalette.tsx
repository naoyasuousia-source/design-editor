import React from 'react';
import { Pipette } from 'lucide-react';

const COLOR_PALETTE = [
    ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#FFFFFF'],
    ['#FF0000', '#FF5E5E', '#FF71A8', '#E2A1F8', '#D258EE', '#9B51E0', '#6124B5'],
    ['#0097A7', '#2DCCFF', '#80E9FF', '#4DABFF', '#5E81AC', '#104E8B', '#001F3F'],
    ['#00C853', '#8BC34A', '#CCFF33', '#FFD54F', '#FFB74D', '#FF8A65', '#E65100']
];

interface ColorPaletteProps {
    type: 'color' | 'backgroundColor' | 'borderColor' | 'stroke' | 'shadow';
    onPick: (property: any) => void;
    onApply: (property: any, color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ type, onPick, onApply }) => {
    const titleMap = {
        color: 'Text Color',
        backgroundColor: 'Fill Color',
        borderColor: 'Border Color',
        stroke: 'Stroke Color',
        shadow: 'Shadow Color'
    };
    const title = titleMap[type] || 'Color';

    return (
        <div className="p-3 border-b border-white/10 flex flex-col gap-3 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                    {title}
                </span>
                <button
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white flex items-center gap-1 text-[10px]"
                    onClick={() => onPick(type)}
                >
                    <Pipette size={12} />
                    <span>Pick</span>
                </button>
            </div>
            <div className="flex flex-col gap-1.5">
                {COLOR_PALETTE.map((row, i) => (
                    <div key={i} className="flex gap-1.5 justify-center">
                        {row.map(color => (
                            <button
                                key={color}
                                className="w-5 h-5 rounded-full border border-white/10 hover:border-white hover:scale-110 transition-all shadow-md"
                                style={{ backgroundColor: color }}
                                onClick={() => onApply(type, color)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColorPalette;
