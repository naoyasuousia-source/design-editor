import React from 'react';
import { cn } from '@/utils/cn';
import { Crop } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

interface ImagePositionPanelProps {
    target: HTMLElement;
    onUpdate: () => void;
    onClose?: () => void;
}

const ImagePositionPanel: React.FC<ImagePositionPanelProps> = ({ target, onClose }) => {
    const { setImageCropMode } = useEditorStore();

    // 1:1 かどうかを簡易判定
    const isSquare = Math.abs(parseFloat(target.style.width) - parseFloat(target.style.height)) < 1 && target.style.width !== '';

    const handleSetRatio = (ratio: 'free' | '1:1') => {
        if (ratio === '1:1') {
            const rect = target.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height);
            target.style.width = `${size}px`;
            target.style.height = `${size}px`;
            target.style.objectFit = 'cover';
        }
        // 比率をセットしたらトリミングモードを起動
        setImageCropMode(true, target.id);
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
                        className={cn(
                            "flex-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200",
                            !isSquare
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                    >
                        Free
                    </button>
                    <button
                        onClick={() => handleSetRatio('1:1')}
                        className={cn(
                            "flex-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200",
                            isSquare
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
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
