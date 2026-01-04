import React, { useState } from 'react';
import type { LayerData } from '@/types/layer';
import { Type, Image, Square, Layers, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LayerItemProps {
    layer: LayerData;
    isActive: boolean;
    isFirst: boolean;
    onSelect: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (position: 'top' | 'bottom') => void;
}

export const LayerItem: React.FC<LayerItemProps> = ({
    layer,
    isActive,
    isFirst,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null);

    const getIcon = () => {
        switch (layer.type) {
            case 'text': return <Type size={16} className="text-blue-400" />;
            case 'image': return <Image size={16} className="text-emerald-400" />;
            case 'shape': return <Square size={16} className="text-amber-400" />;
            case 'group': return <Layers size={16} className="text-purple-400" />;
            default: return <Layers size={16} className="text-gray-400" />;
        }
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;

                // 要件: 一番上のレイヤーのみ上辺への移動を許可
                if (isFirst && y < rect.height / 2) {
                    setDragOverPosition('top');
                } else {
                    setDragOverPosition('bottom');
                }
                onDragOver(e);
            }}
            onDragLeave={() => setDragOverPosition(null)}
            onDrop={() => {
                const position = dragOverPosition || 'bottom';
                setDragOverPosition(null);
                onDrop(position);
            }}
            onClick={onSelect}
            className={cn(
                "group relative flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200",
                "border border-transparent hover:bg-white/5",
                isActive ? "bg-white/10 border-white/10 shadow-lg" : "",
                dragOverPosition === 'top' && "border-t-primary border-t-2 bg-primary/5",
                dragOverPosition === 'bottom' && "border-b-primary border-b-2 bg-primary/5"
            )}
        >
            <div className="opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical size={14} />
            </div>

            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/50 border border-white/5",
                isActive && "bg-primary/20 border-primary/20"
            )}>
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-[13px] font-medium truncate",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                )}>
                    {layer.label}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold opacity-60">
                    {layer.type}
                </div>
            </div>

            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
        </div>
    );
};
