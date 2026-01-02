import React from 'react';

interface ImageReplacePanelProps {
    imageFiles: string[];
    imageUrls: Record<string, string>;
    target: HTMLElement;
    onClose: () => void;
    onUpdate: () => void;
}

const ImageReplacePanel: React.FC<ImageReplacePanelProps> = ({
    imageFiles,
    imageUrls,
    target,
    onClose,
    onUpdate
}) => {
    return (
        <div className="p-2 border-b border-white/5 grid grid-cols-4 gap-1 max-h-32 overflow-y-auto CustomScrollbar bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
            {imageFiles.map(file => (
                <button
                    key={file}
                    className="aspect-square bg-black/20 rounded border border-white/5 hover:border-blue-500 overflow-hidden transition-all"
                    onClick={() => {
                        const path = `./images/${file}`;
                        if (target.tagName.toLowerCase() === 'img') {
                            (target as HTMLImageElement).src = path;
                        } else {
                            target.style.backgroundImage = `url('${path}')`;
                        }
                        onClose();
                        onUpdate();
                    }}
                >
                    <img src={imageUrls[file]} alt={file} className="w-full h-full object-contain" />
                </button>
            ))}
            {imageFiles.length === 0 && (
                <div className="col-span-4 py-2 text-[10px] text-gray-600 italic text-center">
                    No images
                </div>
            )}
        </div>
    );
};

export default ImageReplacePanel;
