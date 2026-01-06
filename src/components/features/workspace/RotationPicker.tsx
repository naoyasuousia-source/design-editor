import React from 'react';
import { RotateCcw, RefreshCcw } from 'lucide-react';
import { rotationService } from '../../../services/rotationService';
import { rotatePoint } from '../../../utils/rotationUtils';

interface RotationPickerProps {
    targets: HTMLElement[];
    position: { x: number; y: number };
    onUpdate: (newPos?: { x: number; y: number }) => void;
    onClose: () => void;
}

export default function RotationPicker({ targets, position, onUpdate }: RotationPickerProps) {
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

        const rect = firstTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const newPos = rotatePoint(position.x, position.y, centerX, centerY, -90);

        onUpdate(newPos);
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        rotationService.resetRotation(targets);
        onUpdate();
    };

    return (
        <div
            className="fixed z-[10001] bg-gray-900/95 border border-white/20 rounded-full shadow-2xl p-1 flex items-center gap-1 backdrop-blur-md animate-in zoom-in-95 duration-200"
            style={{
                left: position.x,
                top: position.y + 30,
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
}
