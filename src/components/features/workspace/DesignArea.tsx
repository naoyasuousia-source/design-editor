import React from 'react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';

interface DesignAreaProps {
    content: string;
    isLocked: boolean;
    config: { label: string };
    canvasRef: React.RefObject<HTMLDivElement | null>;
    handleCanvasClick: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseLeave: () => void;
    updateContentFromDOM: () => void;
}

export const DesignContent = React.memo(({
    content,
    onMouseDown,
    onPaste,
    onMouseMove,
    onMouseLeave,
    onDragOver,
    onDrop
}: {
    content: string;
    onMouseDown: (e: React.MouseEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}) => {
    return (
        <div
            className="absolute inset-0 w-full h-full DesignSurface"
            dangerouslySetInnerHTML={{ __html: content }}
            onMouseDown={onMouseDown}
            onPaste={onPaste}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
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
    handleMouseMove,
    handleMouseLeave,
    updateContentFromDOM
}) => {
    const isApplyingUpdate = useEditorStore(state => state.isApplyingUpdate);
    const customCss = useEditorStore(state => state.customCss);

    return (
        <div
            ref={canvasRef}
            className={cn(
                "w-full h-full bg-white relative",
                isLocked && "brightness-75 grayscale-[0.2]"
            )}
            onMouseDown={handleCanvasClick}
        >
            {/* カスタムCSSの反映 */}
            <style>{customCss}</style>
            <DesignContent
                content={content}
                onMouseDown={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
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

            {isApplyingUpdate && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/40 shadow-2xl border border-white/20 backdrop-blur-md">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                            <div className="relative animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary shadow-inner" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-800 tracking-tight">AI 変更を適用中...</span>
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">Applying smart update</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignArea;
