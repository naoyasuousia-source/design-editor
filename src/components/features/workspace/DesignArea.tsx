import React from 'react';
import { cn } from '@/utils/cn';

interface DesignAreaProps {
    content: string;
    isLocked: boolean;
    config: { label: string };
    canvasRef: React.RefObject<HTMLDivElement | null>;
    handleCanvasClick: (e: React.MouseEvent) => void;
    updateContentFromDOM: () => void;
}

export const DesignContent = React.memo(({
    content,
    onMouseDown,
    onPaste,
    onDragOver,
    onDrop
}: {
    content: string;
    onMouseDown: (e: React.MouseEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}) => {
    return (
        <div
            className="absolute inset-0 w-full h-full DesignSurface"
            dangerouslySetInnerHTML={{ __html: content }}
            onMouseDown={onMouseDown}
            onPaste={onPaste}
            onDragOver={onDragOver}
            onDrop={onDrop}
        />
    );
}, (prev, next) => prev.content === next.content);

const DesignArea: React.FC<DesignAreaProps> = ({
    content,
    isLocked,
    config,
    canvasRef,
    handleCanvasClick,
    updateContentFromDOM
}) => {
    return (
        <div
            ref={canvasRef}
            className={cn(
                "w-full h-full bg-white relative",
                isLocked && "brightness-75 grayscale-[0.2]"
            )}
            onMouseDown={handleCanvasClick}
        >
            <DesignContent
                content={content}
                onMouseDown={handleCanvasClick}
                onPaste={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.contentEditable === 'true') {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const imagePath = e.dataTransfer.getData('text/plain');
                    if (!imagePath || !imagePath.startsWith('./images/')) return;
                    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                    if (!element) return;
                    const target = element.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement;
                    if (!target) return;

                    if (target.tagName.toLowerCase() === 'img') {
                        (target as HTMLImageElement).src = imagePath;
                    } else {
                        target.style.backgroundImage = `url('${imagePath}')`;
                        target.style.backgroundSize = 'contain';
                        target.style.backgroundRepeat = 'no-repeat';
                        target.style.backgroundPosition = 'center';
                    }
                    updateContentFromDOM();
                }}
            />

            {!content && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-gray-800 pointer-events-none select-none overflow-hidden">
                    <h2 className="text-2xl font-bold mb-4">AI-Link Design</h2>
                    <p className="text-gray-500 max-w-sm mb-4">
                        Canvas: {config.label}
                    </p>
                </div>
            )}

            {isLocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px] pointer-events-none">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
};

export default DesignArea;
