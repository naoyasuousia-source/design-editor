import React from 'react';
import { Crop } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

interface ImagePositionPanelProps {
    target: HTMLElement;
    onUpdate: () => void;
    onClose?: () => void;
}

const ImagePositionPanel: React.FC<ImagePositionPanelProps> = ({ target, onClose }) => {
    const { setImageCropMode } = useEditorStore();

    const handleSetRatio = (ratio: 'free' | '1:1') => {
        const aspectRatio = ratio === '1:1' ? 1 : null;
        setImageCropMode(true, target.id, aspectRatio);
        onClose?.();
    };

    return (
        <div className="p-3 border-b border-white/5 flex flex-col gap-3 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center gap-2 mb-1">
                <Crop size={14} className="text-blue-400" />
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Crop Options</span>
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-[10px] text-gray-300 px-1 leading-relaxed">
                    トリミングする比率を選択して、画像上で直接調整してください。
                </p>

                <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 shadow-inner border border-white/5">
                    <button
                        onClick={() => handleSetRatio('free')}
                        className="flex-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        Free
                    </button>
                    <button
                        onClick={() => handleSetRatio('1:1')}
                        className="flex-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                        1:1
                    </button>
                </div>

                <button
                    onClick={() => {
                        setImageCropMode(true, target.id);
                        onClose?.();
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-1"
                >
                    <Crop size={14} />
                    <span>画像上でトリミング</span>
                </button>
            </div>
        </div>
    );
};

export default ImagePositionPanel;
