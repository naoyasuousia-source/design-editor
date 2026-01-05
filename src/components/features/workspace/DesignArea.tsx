import React from 'react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { useAssets } from '@/hooks/useAssets';

interface DesignAreaProps {
    content: string;
    isLocked: boolean;
    config: { label: string };
    canvasRef: React.RefObject<HTMLDivElement | null>;
    handleCanvasClick: (e: React.MouseEvent) => void;
    handleMouseUp: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseLeave: () => void;
    updateContentFromDOM: () => void;
    isHome?: boolean;
    children?: React.ReactNode;
}

export const DesignContent = React.memo(({
    content,
    imageUrls,
    onMouseDown,
    onPaste,
    onMouseMove,
    onMouseLeave,
    onDragOver,
    onDrop
}: {
    content: string;
    imageUrls: Record<string, string>;
    onMouseDown: (e: React.MouseEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}) => {
    // パスの置換処理
    const processedContent = React.useMemo(() => {
        let text = content;
        // 1. src="./images/xxx" の置換
        // より広範な表記ゆれに対応するため、正規表現を強化
        text = text.replace(/src=["'](?:\.\/)?images\/(.+?)["']/g, (match, fileName) => {
            const blobUrl = imageUrls[fileName];
            return blobUrl ? `src="${blobUrl}"` : match;
        });
        // 2. background-image: url(...) の置換 (Reactによる再描画を確実に成功させる)
        text = text.replace(/url\(['"]?(?:\.\/)?images\/([^'"\)]+?)['"]?\)/gi, (match, fileName) => {
            const cleanFileName = fileName.trim();
            const blobUrl = imageUrls[cleanFileName];
            return blobUrl ? `url('${blobUrl}')` : match;
        });
        return text;
    }, [content, imageUrls]);

    return (
        <div
            className="absolute inset-0 w-full h-full DesignSurface"
            dangerouslySetInnerHTML={{ __html: processedContent }}
            onMouseDown={onMouseDown}
            onPaste={onPaste}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        />
    );
}, (prev, next) => (
    prev.content === next.content &&
    prev.imageUrls === next.imageUrls
));

const DesignArea: React.FC<DesignAreaProps> = ({
    content,
    isLocked,
    config,
    canvasRef,
    handleCanvasClick,
    handleMouseUp,
    handleMouseMove,
    handleMouseLeave,
    updateContentFromDOM,
    isHome,
    children
}) => {
    const isApplyingUpdate = useEditorStore(state => state.isApplyingUpdate);
    const customCss = useEditorStore(state => state.customCss);
    const { imageUrls } = useAssets(); // useAssetsをDesignArea側で一括して呼び出す

    return (
        <div
            ref={canvasRef}
            className={cn(
                "w-full h-full relative",
                !isHome && "bg-white text-black",
                (isLocked && !isHome) && "brightness-75 grayscale-[0.2]",
                isHome && "pointer-events-none"
            )}
            onMouseDown={handleCanvasClick}
            onMouseUp={handleMouseUp}
        >
            {/* カスタムCSSの反映 */}
            <style>{customCss}</style>
            <DesignContent
                content={content}
                imageUrls={imageUrls}
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

                    const fileName = imagePath.replace('./images/', '');
                    const displayPath = imageUrls[fileName] || imagePath;

                    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                    if (!element) return;
                    const target = element.closest('.DesignSurface > *, .DesignSurface *') as HTMLElement;
                    if (!target) return;

                    if (target.tagName.toLowerCase() === 'img') {
                        (target as HTMLImageElement).src = displayPath;
                    } else {
                        target.style.backgroundImage = `url('${displayPath}')`;
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
            {children}
        </div>
    );
};

export default DesignArea;
