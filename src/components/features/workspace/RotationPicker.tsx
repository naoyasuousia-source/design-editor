import React from 'react';
import { RotateCcw, RefreshCcw } from 'lucide-react';
import { rotationService } from '@/services/rotationService';

interface RotationPickerProps {
    targets: HTMLElement[];
    position: { x: number; y: number };
    onUpdate: () => void;
    onClose: () => void;
}

const RotationPicker: React.FC<RotationPickerProps> = ({ targets, position, onUpdate, onClose }) => {
    const handleRotate90 = (e: React.MouseEvent) => {
        e.stopPropagation();

        // グループかどうかの判定（targets[0]が選択用オーバーレイの場合は特殊処理）
        const firstTarget = targets[0];
        const isGroup = targets.length > 1 && firstTarget.classList.contains('group-selection-overlay');

        if (isGroup) {
            const [, ...members] = targets;
            console.log('[RotationPicker] Rotating group 90deg', members.length);
            rotationService.rotateGroup90Left(firstTarget, members);
        } else {
            console.log('[RotationPicker] Rotating elements 90deg', targets.length);
            rotationService.rotate90Left(targets);
        }
        console.log('[RotationPicker] Calling onUpdate');
        onUpdate();
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('[RotationPicker] Resetting rotation', targets.length);
        rotationService.resetRotation(targets);
        console.log('[RotationPicker] Calling onUpdate');
        onUpdate();
        onClose();
    };

    return (
        <div
            className="fixed z-[10001] bg-gray-900/95 border border-white/20 rounded-full shadow-2xl p-1 flex items-center gap-1 backdrop-blur-md animate-in zoom-in-95 duration-200"
            style={{
                left: position.x,
                top: position.y + 30, // ハンドルの下に表示
                transform: 'translateX(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
        >
            <button
                onClick={handleRotate90}
                className="p-2 hover:bg-white/10 rounded-full transition-colors group relative"
                title="90°回転"
            >
                <RotateCcw className="w-4 h-4 text-white" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    90°回転
                </span>
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            <button
                onClick={handleReset}
                className="p-2 hover:bg-white/10 rounded-full transition-colors group relative"
                title="リセット"
            >
                <RefreshCcw className="w-4 h-4 text-white" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    リセット
                </span>
            </button>
        </div>
    );
};

export default RotationPicker;
