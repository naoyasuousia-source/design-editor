import React, { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useLayers } from '@/hooks/useLayers';
import { LayerItem } from '@/components/features/layer/LayerItem';
import { X, Layers as LayersIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export const LayerSidebar: React.FC = () => {
    const { isLayerSidebarOpen, setLayerSidebarOpen, selectedIds } = useEditorStore();
    const { layers, handleReorder, selectLayer, handleGroupElements } = useLayers();
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const isMultiSelect = selectedIds.length > 1;

    if (!isLayerSidebarOpen) return null;

    return (
        <div className={cn(
            "relative h-full w-72 bg-[#121212]/95 backdrop-blur-xl border-r border-white/10 z-[50]",
            "flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 ease-out"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <LayersIcon size={18} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">レイヤー</h2>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Layers & Structure</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isMultiSelect && (
                        <button
                            onClick={handleGroupElements}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all animate-in fade-in zoom-in duration-200",
                                "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 active:scale-95"
                            )}
                        >
                            <LayersIcon size={12} />
                            グループ化
                        </button>
                    )}
                    <button
                        onClick={() => setLayerSidebarOpen(false)}
                        className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 CustomScrollbar">
                {layers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                        <LayersIcon size={32} className="mb-4 opacity-20" />
                        <p className="text-xs">要素がありません</p>
                    </div>
                ) : (
                    layers.map((layer, index) => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            isActive={layer.elementIds.every(id => selectedIds.includes(id))}
                            isFirst={index === 0}
                            onSelect={(e) => selectLayer(layer, e)}
                            onDragStart={(e) => {
                                setDraggedId(layer.id);
                                e.dataTransfer.setData('text/plain', layer.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(_e) => {
                                // Prevent default is handled in LayerItem
                            }}
                            onDrop={(position) => {
                                if (draggedId && draggedId !== layer.id) {
                                    handleReorder(draggedId, layer.id, position === 'top' ? 'above' : 'below');
                                }
                                setDraggedId(null);
                            }}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                    ドラッグ＆ドロップで重ね順を変更できます。<br />
                    上が前面、下が背面となります。
                </p>
            </div>
        </div>
    );
};

export default LayerSidebar;
