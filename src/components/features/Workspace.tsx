import React, { useRef } from 'react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { PAGE_SIZES } from '@/types/editor';
import { useAutoSync } from '@/hooks/useAutoSync';
import Moveable from 'react-moveable';
import { useMoveable } from '@/hooks/useMoveable';
import FloatingMenu from './FloatingMenu';

interface WorkspaceProps {
    isLocked: boolean;
}

/**
 * デザインの実際の内容を描画するコンポーネント。
 * React.memo を使用して、content が変更された時のみ再描画されるようにする。
 */
const DesignContent = React.memo(({
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

const Workspace: React.FC<WorkspaceProps> = ({ isLocked }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const {
        pageSize,
        zoom,
        content,
        customWidth,
        customHeight,
        expandCanvas,
        isResponsiveResize
    } = useEditorStore();
    const config = PAGE_SIZES[pageSize];

    const currentWidth = customWidth || config.width;
    const currentHeight = customHeight || config.height;

    const {
        targets,
        keepRatio: moveableKeepRatio,
        handleResizeStart,
        getBounds,
        handleCanvasClick,
        handleDoubleClick,
        updateContentFromDOM
    } = useMoveable(canvasRef);

    useAutoSync();

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
            {/* 視覚的なサイズを確保するラッパー（スクロールと中央寄せ用） */}
            <div
                className="relative shrink-0 shadow-2xl"
                style={{
                    width: `${currentWidth * zoom}px`,
                    height: `${currentHeight * zoom}px`,
                }}
            >
                {/* 
                    スケーリング用のコンテナ。
                    Moveable と DesignContent の両方をこの中に入れることで座標系を同期。
                */}
                <div
                    style={{
                        width: `${currentWidth}px`,
                        height: `${currentHeight}px`,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                >
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

                    {/* GUI 編集ツール (Moveable) - スケールコンテナ内 */}
                    {!isLocked && (
                        <Moveable
                            target={targets}
                            container={canvasRef.current || undefined}
                            draggable={true}
                            resizable={true}
                            snappable={true}
                            bounds={getBounds() || {
                                left: -2000,
                                top: -2000,
                                right: currentWidth + 2000,
                                bottom: currentHeight + 2000,
                            }}
                            keepRatio={moveableKeepRatio || targets.some(el => el.tagName.toLowerCase() === 'img')}
                            throttleDrag={1}
                            throttleResize={1}
                            zoom={1 / zoom}
                            onDrag={e => {
                                e.target.style.transform = e.transform;
                                const rect = e.target.getBoundingClientRect();
                                const canvasRect = canvasRef.current?.getBoundingClientRect();
                                if (canvasRect) {
                                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                                }
                            }}
                            onDragGroup={e => {
                                let maxR = 0;
                                let maxB = 0;
                                e.events.forEach(ev => {
                                    ev.target.style.transform = ev.transform;
                                    const rect = ev.target.getBoundingClientRect();
                                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                                    if (canvasRect) {
                                        maxR = Math.max(maxR, (rect.right - canvasRect.left) / zoom);
                                        maxB = Math.max(maxB, (rect.bottom - canvasRect.top) / zoom);
                                    }
                                });
                                if (maxR > 0 || maxB > 0) expandCanvas(maxR, maxB);
                            }}
                            onResize={e => {
                                const { width, height, drag, target } = e;
                                target.style.width = `${width}px`;
                                target.style.height = `${height}px`;
                                target.style.transform = drag.transform;

                                const lastWidth = parseFloat(target.getAttribute('data-last-width') || target.style.width);
                                const lastHeight = parseFloat(target.getAttribute('data-last-height') || target.style.height);
                                if (lastWidth > 0) {
                                    const ratioW = width / lastWidth;
                                    const ratioH = lastHeight > 0 ? height / lastHeight : ratioW;

                                    if (isResponsiveResize && target.children.length > 0) {
                                        Array.from(target.children).forEach(child => {
                                            const el = child as HTMLElement;
                                            const cW = parseFloat(el.style.width) || el.offsetWidth;
                                            const cH = parseFloat(el.style.height) || el.offsetHeight;
                                            const cL = parseFloat(el.style.left) || el.offsetLeft;
                                            const cT = parseFloat(el.style.top) || el.offsetTop;
                                            const cFs = parseFloat(window.getComputedStyle(el).fontSize);
                                            el.style.width = `${cW * ratioW}px`;
                                            el.style.height = `${cH * ratioH}px`;
                                            el.style.left = `${cL * ratioW}px`;
                                            el.style.top = `${cT * ratioH}px`;
                                            el.style.fontSize = `${cFs * (ratioW + ratioH) / 2}px`;
                                        });
                                    }
                                    const currentFontSize = parseFloat(window.getComputedStyle(target).fontSize);
                                    target.style.fontSize = `${currentFontSize * ratioW}px`;
                                }
                                target.setAttribute('data-last-width', width.toString());
                                target.setAttribute('data-last-height', height.toString());

                                const rect = target.getBoundingClientRect();
                                const canvasRect = canvasRef.current?.getBoundingClientRect();
                                if (canvasRect) {
                                    expandCanvas((rect.right - canvasRect.left) / zoom, (rect.bottom - canvasRect.top) / zoom);
                                }
                            }}
                            onResizeGroup={e => {
                                e.events.forEach(ev => {
                                    const { target, width, height, drag } = ev;
                                    target.style.width = `${width}px`;
                                    target.style.height = `${height}px`;
                                    target.style.transform = drag.transform;

                                    const lastWidth = parseFloat(target.getAttribute('data-last-width') || target.style.width);
                                    if (lastWidth > 0) {
                                        const ratio = width / lastWidth;
                                        const currentFontSize = parseFloat(window.getComputedStyle(target).fontSize);
                                        target.style.fontSize = `${currentFontSize * ratio}px`;
                                    }
                                    target.setAttribute('data-last-width', width.toString());
                                });
                            }}
                            onResizeStart={handleResizeStart}
                            onResizeGroupStart={e => {
                                e.events.forEach(ev => {
                                    (ev.target as HTMLElement).setAttribute('data-last-width', (ev.target as HTMLElement).offsetWidth.toString());
                                });
                            }}
                            onResizeEnd={updateContentFromDOM}
                            onDragEnd={updateContentFromDOM}
                            className="SelectionTool"
                        />
                    )}
                </div>
            </div>

            {/* フローティングメニュー - ズームの影響を受けないよう外側に配置 */}
            {!isLocked && targets.length > 0 && (
                <FloatingMenu
                    targets={targets}
                    onUpdate={updateContentFromDOM}
                />
            )}
        </div>
    );
};

export default Workspace;
