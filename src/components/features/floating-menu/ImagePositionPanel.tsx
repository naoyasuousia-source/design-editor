import React from 'react';
import { cn } from '@/utils/cn';

interface ImagePositionPanelProps {
    target: HTMLElement;
    onUpdate: () => void;
}

const ImagePositionPanel: React.FC<ImagePositionPanelProps> = ({ target, onUpdate }) => {
    const isSquare = target.style.width === target.style.height && target.style.width !== '';

    const handleSetRatio = (ratio: 'free' | '1:1') => {
        if (ratio === '1:1') {
            const rect = target.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height);
            target.style.width = `${size}px`;
            target.style.height = `${size}px`;
            target.style.objectFit = 'cover';
        } else {
            // Free は現状のサイズを維持するだけで良い（リサイズハンドルで自由に調整可能にするため）
            // ただし、もし1:1から戻す際に何かリセットが必要ならここで行う
            // 現状は四隅リサイズが有効なので、そのままリサイズすればFreeになる
        }
        onUpdate();
    };

    return (
        <div className="p-3 border-b border-white/5 flex flex-col gap-3 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Aspect Ratio</span>
                <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
                    <button
                        onClick={() => handleSetRatio('free')}
                        className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            !isSquare ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Free
                    </button>
                    <button
                        onClick={() => handleSetRatio('1:1')}
                        className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            isSquare ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        1:1
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Image Positioning</span>
                <div className="flex flex-col gap-3 p-2 bg-black/20 rounded-lg">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Horizontal</span>
                            <span>{target.style.objectPosition.split(' ')[0] || '50%'}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={parseInt(target.style.objectPosition.split(' ')[0]) || 50}
                            onInput={(e) => {
                                const val = (e.target as HTMLInputElement).value;
                                const y = target.style.objectPosition.split(' ')[1] || '50%';
                                target.style.objectPosition = `${val}% ${y}`;
                                onUpdate();
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] text-gray-500">
                            <span>Vertical</span>
                            <span>{target.style.objectPosition.split(' ')[1] || '50%'}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            value={parseInt(target.style.objectPosition.split(' ')[1]) || 50}
                            onInput={(e) => {
                                const val = (e.target as HTMLInputElement).value;
                                const x = target.style.objectPosition.split(' ')[0] || '50%';
                                target.style.objectPosition = `${x} ${val}%`;
                                onUpdate();
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePositionPanel;
