import React, { useRef } from 'react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { PAGE_SIZES } from '@/types/editor';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useMoveable } from '@/hooks/useMoveable';
import FloatingMenu from '@/components/features/floating-menu/FloatingMenu';
import DesignArea from '@/components/features/workspace/DesignArea';
import MoveableManager from '@/components/features/workspace/MoveableManager';
import ImageCropOverlay from '@/components/features/workspace/ImageCropOverlay';
import ImageSaveWizard from '@/components/features/image-save/ImageSaveWizard';
import { HOME_AD_HTML } from '@/utils/home/adTemplate';

interface WorkspaceProps {
    isLocked: boolean;
    isHome?: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ isLocked, isHome }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const {
        pageSize: storePageSize,
        zoom,
        content: storeContent,
        customWidth,
        customHeight,
        expandCanvas,
    } = useEditorStore();

    // ホーム画面（未接続）時は固定の広告テンプレートを表示
    const pageSize = isHome ? 'SQUARE' : storePageSize;
    const content = isHome ? HOME_AD_HTML : storeContent;

    const config = PAGE_SIZES[pageSize];
    const currentWidth = isHome ? config.width : (customWidth || config.width);
    const currentHeight = isHome ? config.height : (customHeight || config.height);

    const {
        targets,
        keepRatio: moveableKeepRatio,
        handleResizeStart,
        getBounds,
        handleCanvasClick,
        handleMouseUp,
        handleMouseMove,
        handleMouseLeave,
        updateContentFromDOM,
        isTextBox,
        getRenderDirections,
        selectionMode,
        activeSubTarget,
        selectNone,
        hoverTargets
    } = useMoveable(canvasRef);

    useAutoSync();

    return (
        <div className={cn(
            "h-full w-full relative flex select-none",
            isHome ? "overflow-hidden" : "overflow-auto CustomScrollbar"
        )}>
            {/* 視覚的なサイズを確保するラッパー（スクロールと中央寄せ用） */}
            <div
                className={cn(
                    "relative shrink-0 shadow-2xl mx-auto",
                    isHome ? "m-auto" : "m-auto my-16"
                )}
                style={{
                    width: `${currentWidth * zoom}px`,
                    height: `${currentHeight * zoom}px`,
                }}
            >
                {/* スケールコンテナ */}
                <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={{
                        width: `${currentWidth}px`,
                        height: `${currentHeight}px`,
                        transform: `scale(${zoom})`,
                    }}
                >
                    <DesignArea
                        content={content}
                        isLocked={isLocked}
                        config={config}
                        canvasRef={canvasRef}
                        isHome={isHome}
                        handleCanvasClick={handleCanvasClick}
                        handleMouseUp={handleMouseUp}
                        handleMouseMove={handleMouseMove}
                        handleMouseLeave={handleMouseLeave}
                        updateContentFromDOM={updateContentFromDOM}
                    >
                        {!isLocked && (
                            <MoveableManager
                                targets={targets}
                                canvasRef={canvasRef}
                                getRenderDirections={getRenderDirections}
                                getBounds={getBounds}
                                currentWidth={currentWidth}
                                currentHeight={currentHeight}
                                moveableKeepRatio={moveableKeepRatio}
                                zoom={zoom}
                                expandCanvas={expandCanvas}
                                isTextBox={isTextBox}
                                selectionMode={selectionMode}
                                activeSubTarget={activeSubTarget}
                                hoverTargets={hoverTargets}
                                handleResizeStart={handleResizeStart}
                                updateContentFromDOM={updateContentFromDOM}
                            />
                        )}
                    </DesignArea>
                </div>
            </div>

            {!isLocked && targets.length > 0 && (
                <FloatingMenu
                    targets={targets}
                    onUpdate={updateContentFromDOM}
                    selectionMode={selectionMode}
                    activeSubTarget={activeSubTarget}
                    onClearSelection={selectNone}
                />
            )}

            <ImageCropOverlay />
            <ImageSaveWizard />
        </div>
    );
};

export default Workspace;
