import React from 'react';
import { RotateCcw, RefreshCcw } from 'lucide-react';
import { rotationService } from '../../../services/rotationService';

interface RotationPickerProps {
    targets: HTMLElement[];
    onUpdate: (newPos?: { x: number; y: number }) => void;
    onClose: () => void;
}

export default function RotationPicker({ targets, onUpdate }: RotationPickerProps) {
    const handleRotate90 = (e: React.MouseEvent) => {
        e.stopPropagation();

        const firstTarget = targets[0];
        if (!firstTarget) return;

        const isGroup = targets.length > 1 && firstTarget.classList.contains('group-selection-overlay');

        if (isGroup) {
            const members = targets.slice(1);
            rotationService.rotateGroup90Left(firstTarget, members);
        } else {
            rotationService.rotate90Left(targets);
        }

        onUpdate();
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        rotationService.resetRotation(targets);
        onUpdate();
    };

    return (
        <div
            className="bg-gray-900/95 border border-white/20 rounded-full shadow-2xl p-1 flex items-center gap-1 backdrop-blur-md animate-in slide-in-from-left-2 duration-200"
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
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
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
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    リセット
                </span>
            </button>
        </div>
    );
}
