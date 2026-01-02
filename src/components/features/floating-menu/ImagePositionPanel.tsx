import React from 'react';

interface ImagePositionPanelProps {
    target: HTMLElement;
    onUpdate: () => void;
}

const ImagePositionPanel: React.FC<ImagePositionPanelProps> = ({ target, onUpdate }) => {
    return (
        <div className="p-3 border-b border-white/5 flex flex-col gap-2 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Image Positioning</span>
            <div className="flex flex-col gap-3 p-2 bg-black/20 rounded">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-gray-500">
                        <span>Horizontal</span>
                        <span>{target.style.objectPosition.split(' ')[0] || '50%'}</span>
                    </div>
                    <input
                        type="range" min="0" max="100"
                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        onChange={(e) => {
                            const y = target.style.objectPosition.split(' ')[1] || '50%';
                            target.style.objectPosition = `${e.target.value}% ${y}`;
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
                        onChange={(e) => {
                            const x = target.style.objectPosition.split(' ')[0] || '50%';
                            target.style.objectPosition = `${x} ${e.target.value}%`;
                            onUpdate();
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImagePositionPanel;
