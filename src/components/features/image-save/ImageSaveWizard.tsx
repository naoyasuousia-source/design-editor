import React from 'react';
import { Camera, X, Check, Crop } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useImageSave } from '@/hooks/features/image-save/useImageSave';
import { CropOverlay } from './CropOverlay';

const ImageSaveWizard: React.FC = () => {
    const {
        isCropping, setIsCropping,
        isSaving, isTransparent, setIsTransparent,
        cropRect, surfaceBounds,
        zoom, cropAspectRatio, setCropAspectRatio,
        handleCancel, handleSave, handleMouseDown,
        isImageSaveMode
    } = useImageSave();

    if (!isImageSaveMode) return null;

    return (
        <div className="fixed inset-0 z-[150] pointer-events-none flex flex-col items-center">
            {/* ウィザードツールバー */}
            <div className="mt-20 pointer-events-auto bg-sidebar border border-white/10 rounded-full shadow-2xl p-1.5 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-1 px-4 border-r border-white/10 py-1">
                    <Camera size={16} className="text-blue-400" />
                    <span className="text-sm font-bold text-white ml-2">画像として保存</span>
                </div>

                <div className="flex items-center gap-1 p-1">
                    <button
                        onClick={() => setIsCropping(!isCropping)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all text-white",
                            isCropping ? "bg-blue-500" : "hover:bg-white/5"
                        )}
                    >
                        <Crop size={14} />
                        <span>トリミング</span>
                    </button>

                    {isCropping && (
                        <div className="flex items-center gap-1 ml-1 bg-black/20 rounded-full p-0.5">
                            {[
                                { label: 'Free', value: 'free' },
                                { label: '1:1', value: 1 },
                                { label: '9:16', value: 9 / 16 },
                                { label: 'A4', value: 794 / 1123 },
                            ].map(ratio => (
                                <button
                                    key={ratio.label}
                                    onClick={() => setCropAspectRatio(ratio.value as number | 'free' | null)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold transition-all",
                                        cropAspectRatio === ratio.value ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    {ratio.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 px-3 border-r border-white/10 py-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isTransparent}
                                onChange={(e) => setIsTransparent(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={cn(
                                "w-8 h-4 rounded-full transition-colors duration-200 ease-in-out",
                                isTransparent ? "bg-blue-600" : "bg-white/10"
                            )} />
                            <div className={cn(
                                "absolute left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm",
                                isTransparent ? "translate-x-4" : "translate-x-0"
                            )} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors uppercase select-none">
                            透明背景
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-2 py-1 pr-1">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-blue-600/20"
                    >
                        {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Check size={14} />
                        )}
                        <span>{isSaving ? '保存中...' : '保存'}</span>
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {isCropping && (
                <CropOverlay
                    cropRect={cropRect}
                    surfaceBounds={surfaceBounds}
                    zoom={zoom}
                    onMouseDown={handleMouseDown}
                />
            )}
        </div>
    );
};

export default ImageSaveWizard;
