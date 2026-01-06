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

const parseInlineStyle = (styleStr: string): React.CSSProperties => {
    const styles: Record<string, string> = {};
    styleStr.split(';').forEach(s => {
        const [k, v] = s.split(':').map(str => str.trim());
        if (k && v) {
            const camelKey = k.replace(/-([a-z])/g, g => g[1].toUpperCase());
            styles[camelKey] = v;
        }
    });
    return styles as React.CSSProperties;
};


const PreviewShape = ({ style }: { style: React.CSSProperties }) => {
    const w = parseFloat(String(style.width || '100'));
    const h = parseFloat(String(style.height || '100'));
    const max = 32;
    const ratio = w / h;

    // 縮小率の計算
    const scale = ratio > 1 ? max / w : max / h;
    const displayWidth = ratio > 1 ? max : max * ratio;
    const displayHeight = ratio > 1 ? max / ratio : max;

    // 角丸のスケール調整
    const rawRadius = String(style.borderRadius || '0');
    let displayRadius = '0px';
    if (rawRadius.includes('%')) {
        displayRadius = rawRadius;
    } else {
        const radiusValue = parseFloat(rawRadius);
        displayRadius = `${radiusValue * scale}px`;
    }

    return (
        <div
            className="border border-black/10 shrink-0 shadow-sm"
            style={{
                ...style,
                position: 'static',
                transform: 'none',
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                borderRadius: displayRadius,
                margin: '0'
            }}
        />
    );
};

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
            case 'text': return <Type size={16} className="text-blue-600" />;
            case 'image': return <Image size={16} className="text-emerald-600" />;
            case 'shape': return <Square size={16} className="text-amber-600" />;
            case 'group': return <Layers size={16} className="text-purple-600" />;
            default: return <Layers size={16} className="text-gray-600" />;
        }
    };

    const elementStyle = parseInlineStyle(layer.style || '');

    // プレビュー用の共通計算
    // プレビュー用の共通計算
    const renderTextPreview = () => {
        const w = parseFloat(String(elementStyle.width || '0'));
        const h = parseFloat(String(elementStyle.height || '0'));

        // 背景色またはボーダーがある場合のみ「装飾されたコンテナ」として扱う
        const hasBg = elementStyle.backgroundColor && elementStyle.backgroundColor !== 'transparent' && elementStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
        const hasBorder = elementStyle.border && elementStyle.border !== 'none' && elementStyle.border !== '';
        const isActuallyContainer = (hasBg || hasBorder) && w > 0 && h > 0;

        const max = 32;

        if (isActuallyContainer) {
            const ratio = w / h;
            const scale = ratio > 1 ? max / w : max / h;
            const displayWidth = ratio > 1 ? max : max * ratio;
            const displayHeight = ratio > 1 ? max / ratio : max;

            const rawRadius = String(elementStyle.borderRadius || '0');
            const displayRadius = rawRadius.includes('%')
                ? rawRadius
                : `${parseFloat(rawRadius) * scale}px`;

            return (
                <div
                    style={{
                        ...elementStyle,
                        position: 'static',
                        transform: 'none',
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        borderRadius: displayRadius,
                        // コンテナ内の文字は枠に合わせてさらに小型化
                        fontSize: `${Math.min(Math.max(parseFloat(String(elementStyle.fontSize || '16')) * scale * 0.9, 8), 18)}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        letterSpacing: 'normal',
                        whiteSpace: 'nowrap',
                        padding: '0',
                        margin: '0'
                    }}
                >
                    {layer.content}
                </div>
            );
        }

        // 通常のテキスト（巨大な数字などを含む）
        return (
            <div
                style={{
                    ...elementStyle,
                    position: 'static',
                    transform: 'none',
                    width: '100%',
                    height: 'auto',
                    // フォントサイズのスケーリング (最大36pxまで拡大を許可して強弱を出す)
                    fontSize: `${Math.min(Math.max(parseFloat(String(elementStyle.fontSize || '16')) * 0.2, 11), 36)}px`,
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: elementStyle.color || '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexShrink: 0,
                    fontWeight: elementStyle.fontWeight || 'bold',
                    letterSpacing: 'normal',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0'
                }}
            >
                {layer.content}
            </div>
        );
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;

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
                "bg-slate-200/40 border border-slate-300/50 hover:bg-slate-100/80",
                isActive ? "bg-white border-primary ring-2 ring-primary/20 shadow-md" : "shadow-sm",
                dragOverPosition === 'top' && "border-t-primary border-t-2 bg-primary/10",
                dragOverPosition === 'bottom' && "border-b-primary border-b-2 bg-primary/10"
            )}
        >
            <div className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing text-slate-500">
                <GripVertical size={14} />
            </div>

            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 border border-black/5 shrink-0",
                isActive && "bg-primary/10 border-primary/20"
            )}>
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0 h-10 flex items-center overflow-hidden px-1">
                {layer.type === 'text' && renderTextPreview()}
                {layer.type === 'shape' && (
                    <div className="flex items-center w-full justify-start">
                        <PreviewShape style={elementStyle} />
                    </div>
                )}
                {layer.type === 'image' && (
                    <div className="flex items-center w-full justify-start">
                        <div className="w-12 h-9 rounded border border-black/10 overflow-hidden bg-white/40 shrink-0 shadow-sm">
                            <img
                                src={layer.src}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}
                {layer.type === 'group' && (
                    <div className="text-[13px] font-bold text-purple-700/80 truncate px-1">
                        {layer.label}
                    </div>
                )}
                {layer.type === 'unknown' && (
                    <div className="text-[12px] text-slate-500 truncate px-1">
                        {layer.label}
                    </div>
                )}
            </div>

            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0" />
            )}
        </div>
    );
};
