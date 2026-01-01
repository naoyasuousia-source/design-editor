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

const Workspace: React.FC<WorkspaceProps> = ({ isLocked }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const { pageSize, zoom, content, customWidth, customHeight, expandCanvas } = useEditorStore();
    const config = PAGE_SIZES[pageSize];

    // 現在の論理サイズ（カスタム値があれば優先）
    const currentWidth = customWidth || config.width;
    const currentHeight = customHeight || config.height;

    // GUI 編集ロジック
    const {
        targets,
        handleCanvasClick,
        handleDoubleClick,
        updateContentFromDOM
    } = useMoveable(canvasRef);

    // AI更新検知の開始
    useAutoSync();

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
            {/* 
        デザイン領域（キャンバス）
        選択されたページサイズとズーム倍率に基づいて動的にサイズを変更。
      */}
            <div
                ref={canvasRef}
                style={{
                    width: `${currentWidth * zoom}px`,
                    height: `${currentHeight * zoom}px`,
                }}
                className={cn(
                    "bg-white shadow-2xl relative transition-all duration-300 origin-center",
                    isLocked && "brightness-75 grayscale-[0.2]"
                )}
                onMouseDown={handleCanvasClick}
                onDoubleClick={handleDoubleClick}
            >
                {/* メインコンテンツ（AI生成HTML） */}
                <div
                    className="absolute inset-0 w-full h-full DesignSurface"
                    dangerouslySetInnerHTML={{ __html: content }}
                    contentEditable={!isLocked}
                    suppressContentEditableWarning={true}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        const imagePath = e.dataTransfer.getData('text/plain');
                        if (!imagePath || !imagePath.startsWith('./images/')) return;

                        // ドロップ位置の要素を特定
                        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                        if (!element) return;

                        // DesignSurface 内の要素を探す
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

                {/* コンテンツがない場合の初期表示（使い方説明） */}
                {!content && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-gray-800 pointer-events-none select-none overflow-hidden">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">AI-Link Design</h2>
                        <p className="text-gray-500 leading-relaxed max-w-sm mb-4">
                            キャンバスサイズ: <span className="font-bold text-gray-700">{config.label}</span>
                        </p>
                        <div className="text-xs text-gray-400">
                            左上のメニューから新しいプロジェクトを開始するか、<br />既存のHTMLファイルを開いてください。
                        </div>
                    </div>
                )}

                {/* ロック時のオーバーレイ */}
                {isLocked && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px] pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-primary">デザインを同期中...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* GUI 編集ツール (Moveable) */}
            {!isLocked && (
                <Moveable
                    target={targets}
                    draggable={true}
                    resizable={true}
                    rotatable={false}
                    snappable={true}
                    // 拡張を許容するため、bounds を現在のサイズより広く設定、または制限を緩める
                    // ここでは要素が完全に見失われない程度の広い範囲を設定
                    bounds={{
                        left: -2000,
                        top: -2000,
                        right: currentWidth + 2000,
                        bottom: currentHeight + 2000,
                    }}
                    snapThreshold={5}
                    elementSnapDirections={true}
                    elementGuidelines={Array.from(canvasRef.current?.querySelectorAll('.DesignSurface > *') || []) as HTMLElement[]}
                    origin={false}
                    edge={false}
                    keepRatio={targets.some(el => el.tagName.toLowerCase() === 'img')}
                    throttleDrag={1}
                    throttleResize={1}
                    onDrag={e => {
                        e.target.style.transform = e.transform;

                        // はみ出しチェックと拡張
                        const rect = e.target.getBoundingClientRect();
                        const canvasRect = canvasRef.current?.getBoundingClientRect();
                        if (canvasRect) {
                            const relativeRight = (rect.right - canvasRect.left) / zoom;
                            const relativeBottom = (rect.bottom - canvasRect.top) / zoom;
                            expandCanvas(relativeRight, relativeBottom);
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
                    onDragEnd={updateContentFromDOM}
                    onResize={e => {
                        const { width, height, drag, target } = e;
                        target.style.width = `${width}px`;
                        target.style.height = `${height}px`;
                        target.style.transform = drag.transform;

                        // テキストサイズのスケーリング連動
                        const lastWidth = parseFloat(target.getAttribute('data-last-width') || target.style.width);
                        if (lastWidth > 0) {
                            const ratio = width / lastWidth;
                            const currentFontSize = parseFloat(window.getComputedStyle(target).fontSize);
                            target.style.fontSize = `${currentFontSize * ratio}px`;
                        }
                        target.setAttribute('data-last-width', width.toString());

                        // 拡張
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
                    onResizeStart={e => {
                        e.target.setAttribute('data-last-width', (e.target as HTMLElement).offsetWidth.toString());
                    }}
                    onResizeGroupStart={e => {
                        e.events.forEach(ev => {
                            (ev.target as HTMLElement).setAttribute('data-last-width', (ev.target as HTMLElement).offsetWidth.toString());
                        });
                    }}
                    onResizeEnd={updateContentFromDOM}
                    className="SelectionTool"
                />
            )}

            {/* フローティングメニュー */}
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
