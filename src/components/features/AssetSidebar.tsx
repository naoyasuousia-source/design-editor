import React, { useState } from 'react';
import {
    FileCode,
    Image as ImageIcon,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAssets } from '@/hooks/useAssets';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useEditorStore } from '@/store/useEditorStore';

const AssetSidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { htmlFiles, imageFiles, imageUrls, refreshAssets } = useAssets();
    const { openFile } = useFileSystem();
    const { fileName, isDirty } = useEditorStore();

    const handleFileClick = async (targetFileName: string) => {
        if (targetFileName === fileName) return;

        if (isDirty) {
            if (!confirm('編集中の内容は破棄されます。よろしいですか？')) {
                return;
            }
        }
        await openFile(targetFileName);
    };

    const filteredHtml = htmlFiles.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredImages = imageFiles.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <aside
            className={cn(
                "h-full bg-sidebar border-r border-white/5 flex flex-col transition-all duration-300 relative z-40 shadow-xl",
                isCollapsed ? "w-12" : "w-64"
            )}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-sidebar border border-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all z-50 shadow-lg"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {!isCollapsed && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-sidebar/50">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Assets</h2>
                        <button
                            onClick={refreshAssets}
                            className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-blue-400 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-3">
                        <div className="relative group">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-md py-1.5 pl-8 pr-3 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* HTML Files */}
                        <div className="mb-6">
                            <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-tighter flex items-center gap-2">
                                <FileCode size={12} />
                                <span>HTML Files</span>
                            </div>
                            <div className="px-2 space-y-0.5">
                                {filteredHtml.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => handleFileClick(f)}
                                        className={cn(
                                            "w-full text-left px-3 py-1.5 rounded-md text-xs transition-all group relative overflow-hidden",
                                            f === fileName
                                                ? "bg-primary/20 text-primary-foreground border border-primary/20"
                                                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="relative z-10 truncate block">{f}</span>
                                        {f === fileName && (
                                            <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                                        )}
                                    </button>
                                ))}
                                {filteredHtml.length === 0 && (
                                    <div className="px-4 py-3 text-[10px] text-gray-600 italic">No HTML files found</div>
                                )}
                            </div>
                        </div>

                        {/* Images */}
                        <div>
                            <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-tighter flex items-center gap-2">
                                <ImageIcon size={12} />
                                <span>Images</span>
                            </div>
                            <div className="px-2 grid grid-cols-2 gap-2 p-2">
                                {filteredImages.map((f) => (
                                    <div
                                        key={f}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', `./images/${f}`);
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        className="group cursor-grab active:cursor-grabbing bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden hover:border-blue-500/50 transition-all p-1"
                                        title={f}
                                    >
                                        <div className="aspect-square bg-checkerboard rounded overflow-hidden mb-1 relative">
                                            {imageUrls[f] ? (
                                                <img
                                                    src={imageUrls[f]}
                                                    alt={f}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-gray-500 truncate group-hover:text-gray-300 px-0.5">
                                            {f}
                                        </div>
                                    </div>
                                ))}
                                {filteredImages.length === 0 && (
                                    <div className="col-span-2 px-2 py-3 text-[10px] text-gray-600 italic text-center">No images found</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapsed State Bar */}
            {isCollapsed && (
                <div className="flex flex-col items-center py-4 gap-4">
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <FileCode size={18} />
                    </button>
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <ImageIcon size={18} />
                    </button>
                </div>
            )}
        </aside>
    );
};

export default AssetSidebar;
