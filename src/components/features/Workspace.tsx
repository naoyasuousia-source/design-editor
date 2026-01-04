import React, { useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { PAGE_SIZES } from '@/types/editor';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useMoveable } from '@/hooks/useMoveable';
import FloatingMenu from './FloatingMenu';
import DesignArea from './workspace/DesignArea';
import MoveableManager from './workspace/MoveableManager';
import ImageCropOverlay from './workspace/ImageCropOverlay';
import ImageSaveWizard from './ImageSaveWizard';

interface WorkspaceProps {
    isLocked: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ isLocked }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const {
        pageSize,
        zoom,
        content,
        customWidth,
        customHeight,
        expandCanvas,
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
        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto CustomScrollbar">
            {/* 視覚的なサイズを確保するラッパー（スクロールと中央寄せ用） */}
            <div
                className="relative shrink-0 shadow-2xl"
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
