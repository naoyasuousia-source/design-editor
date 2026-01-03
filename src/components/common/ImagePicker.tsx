import React from 'react';
import { X, ImageIcon, Search, RefreshCw } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';

interface ImagePickerProps {
    onSelect: (path: string) => void;
    onClose: () => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onSelect, onClose }) => {
    const { imageFiles, imageUrls, refreshAssets } = useAssets();
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredImages = imageFiles.filter(f =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-sidebar border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-in-center">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">画像を選択</h3>
                            <p className="text-xs text-gray-400">プロジェクトの images フォルダ内を表示しています</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-white/5 flex items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="ファイル名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                    <button
                        onClick={refreshAssets}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-2"
                        title="再読み込み"
                    >
                        <RefreshCw size={16} />
                        <span className="text-xs font-medium">更新</span>
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-[300px]">
                    {filteredImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {filteredImages.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => onSelect(`./images/${f}`)}
                                    className="group flex flex-col gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/50 hover:bg-white/10 transition-all text-left"
                                >
                                    <div className="aspect-square bg-checkerboard rounded-xl overflow-hidden relative">
                                        {imageUrls[f] ? (
                                            <img
                                                src={imageUrls[f]}
                                                alt={f}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 truncate group-hover:text-blue-400 transition-colors px-1 font-medium">
                                        {f}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-500 opacity-50">
                            <ImageIcon size={48} className="mb-4" />
                            <p className="text-sm">画像が見つかりません</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagePicker;
