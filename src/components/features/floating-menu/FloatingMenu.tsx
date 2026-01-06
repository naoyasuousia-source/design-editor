import React, { useRef } from 'react';
import {
    Circle,
    Trash2,
    ImagePlus,
    Square,
    Scissors,
    Copy,
    Layers,
    Eraser
} from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { useFloatingMenu } from '@/hooks/useFloatingMenu';
import ColorPalette from '@/components/features/floating-menu/ColorPalette';
import RadiusPicker from '@/components/features/floating-menu/RadiusPicker';
import ImageReplacePanel from '@/components/features/floating-menu/ImageReplacePanel';
import TextSettings from '@/components/features/floating-menu/TextSettings';
import ParagraphSettings from '@/components/features/floating-menu/ParagraphSettings';
import EffectSettings from '@/components/features/floating-menu/EffectSettings';
import MenuHeader from '@/components/features/floating-menu/MenuHeader';
import GroupActions from '@/components/features/floating-menu/GroupActions';
import type { SelectionMode } from '@/hooks/moveable/useSelection';
import { getTargetType } from '@/utils/domUtils';
import type { TargetType } from '@/utils/domUtils';

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
    selectionMode: SelectionMode;
    activeSubTarget: HTMLElement | null;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    onClearSelection?: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate, selectionMode, activeSubTarget, canvasRef, onClearSelection }) => {
    const { imageFiles, imageUrls } = useAssets();
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        rect, target, isGrouped, canGroup, groupId,
        showImagePicker, setShowImagePicker,
        showColorPalette, setShowColorPalette,
        showBorderPalette, setShowBorderPalette,
        showBgPalette, setShowBgPalette,
        showRadiusPicker, setShowRadiusPicker,
        localRadius, setLocalRadius,
        showSizeDropdown, setShowSizeDropdown,
        showParagraphSettings, setShowParagraphSettings,
        showEffectSettings, setShowEffectSettings,
        showShadowPalette, setShowShadowPalette,
        showTextBgPalette, setShowTextBgPalette,
        showStrokePalette, setShowStrokePalette,
        applyStyle, setImageCropMode, handleGroup, handleUngroup, handleDelete, handleDuplicate, handleRemoveBackground, toggleBold, openEyeDropper, closeAllPanels
    } = useFloatingMenu(targets, onUpdate, canvasRef, onClearSelection, selectionMode, activeSubTarget);

    if (!rect || !target) return null;

    const displayTarget = target;

    const handleCopyId = () => {
        if (displayTarget.id) navigator.clipboard.writeText(displayTarget.id);
    };

    const handleCopyGroupId = () => {
        if (groupId) navigator.clipboard.writeText(groupId);
    };

    const currentType: TargetType = getTargetType(displayTarget);
    const isText = currentType === 'text';
    const isImage = currentType === 'image';
    const isShape = currentType === 'shape';


    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-[10001] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex flex-col gap-1",
                "animate-in fade-in zoom-in-95 duration-200 min-w-[200px] translate-x-[-50%]"
            )}
            style={{
                bottom: `${window.innerHeight - rect.top + 8}px`,
                left: `${rect.left + rect.width / 2}px`,
            }}
        >
            <MenuHeader
                id={displayTarget.id}
                groupId={groupId}
                isGrouped={isGrouped && selectionMode === 'group'}
                canGroup={canGroup}
                onCopyId={handleCopyId}
                onCopyGroupId={handleCopyGroupId}
            />

            {(canGroup || (isGrouped && selectionMode === 'group')) ? (
                <GroupActions
                    isGrouped={isGrouped}
                    canGroup={canGroup}
                    onGroup={handleGroup}
                    onUngroup={handleUngroup}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                />
            ) : (
                <>
                    {/* Floating Panels */}
                    {showColorPalette && <ColorPalette type="color" onPick={() => openEyeDropper('color')} onApply={(t, v) => applyStyle(t as keyof CSSStyleDeclaration, v)} />}
                    {showBgPalette && <ColorPalette type="backgroundColor" onPick={() => openEyeDropper('backgroundColor')} onApply={(t, v) => applyStyle(t as keyof CSSStyleDeclaration, v)} />}
                    {showBorderPalette && <ColorPalette type="borderColor" onPick={() => openEyeDropper('borderColor')} onApply={(t, v) => applyStyle(t as keyof CSSStyleDeclaration, v)} />}
                    {showShadowPalette && (
                        <ColorPalette
                            type="shadow"
                            onPick={() => openEyeDropper((v) => {
                                const s = window.getComputedStyle(displayTarget);
                                const cur = displayTarget.style.textShadow || s.textShadow;
                                const pts = cur.split(' ').filter(p => p.includes('px'));
                                applyStyle('textShadow', `${pts.join(' ')} ${v}`);
                            })}
                            onApply={(_, v) => {
                                const s = window.getComputedStyle(displayTarget);
                                const cur = displayTarget.style.textShadow || s.textShadow;
                                const pts = cur.split(' ').filter(p => p.includes('px'));
                                applyStyle('textShadow', `${pts.join(' ')} ${v}`);
                            }}
                        />
                    )}
                    {showTextBgPalette && <ColorPalette type="backgroundColor" onPick={() => openEyeDropper('backgroundColor')} onApply={(_, v) => applyStyle('backgroundColor', v)} />}
                    {showStrokePalette && <ColorPalette type="stroke" onPick={() => openEyeDropper((v) => applyStyle('webkitTextStrokeColor' as keyof CSSStyleDeclaration, v))} onApply={(_, v) => applyStyle('webkitTextStrokeColor' as keyof CSSStyleDeclaration, v)} />}

                    {showParagraphSettings && isText && <ParagraphSettings target={displayTarget} onApply={applyStyle} onUpdate={onUpdate} />}
                    {showEffectSettings && isText && (
                        <EffectSettings
                            target={displayTarget} targets={targets}
                            showShadowPalette={showShadowPalette} setShowShadowPalette={setShowShadowPalette}
                            showTextBgPalette={showTextBgPalette} setShowTextBgPalette={setShowTextBgPalette}
                            showStrokePalette={showStrokePalette} setShowStrokePalette={setShowStrokePalette}
                            onApply={applyStyle} onUpdate={onUpdate} closeAllPanels={closeAllPanels}
                        />
                    )}
                    {showRadiusPicker && <RadiusPicker target={displayTarget} localRadius={localRadius} setLocalRadius={setLocalRadius} onApply={applyStyle} onUpdate={onUpdate} />}
                    {showImagePicker && isImage && <ImageReplacePanel imageFiles={imageFiles} imageUrls={imageUrls} target={displayTarget} onClose={() => setShowImagePicker(false)} onUpdate={onUpdate} />}

                    {/* Main Toolbar */}
                    <div className="flex items-center gap-1 p-1">
                        {isText && (
                            <TextSettings
                                target={displayTarget} showSizeDropdown={showSizeDropdown} setShowSizeDropdown={setShowSizeDropdown}
                                showColorPalette={showColorPalette} setShowColorPalette={(s) => { closeAllPanels(); setShowColorPalette(s); }}
                                onApply={applyStyle} onToggleBold={toggleBold}
                                showParagraphSettings={showParagraphSettings} setShowParagraphSettings={(s) => { closeAllPanels(); setShowParagraphSettings(s); }}
                                showEffectSettings={showEffectSettings} setShowEffectSettings={(s) => { closeAllPanels(); setShowEffectSettings(s); }}
                            />
                        )}

                        {isShape && (
                            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                                <button
                                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).backgroundColor }}
                                    onClick={() => { const n = !showBgPalette; closeAllPanels(); setShowBgPalette(n); }}
                                    title="Fill Color"
                                >
                                    {showBgPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                                </button>
                                <button
                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                    onClick={() => {
                                        const cur = displayTarget.style.borderWidth || '0px';
                                        const n = cur === '0px' ? '2px' : '0px';
                                        applyStyle('borderStyle', 'solid');
                                        applyStyle('borderWidth', n);
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#000000');
                                    }}
                                    title="Border Toggle"
                                >
                                    <Square size={14} />
                                </button>
                                <button
                                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).borderColor }}
                                    onClick={() => { const n = !showBorderPalette; closeAllPanels(); setShowBorderPalette(n); }}
                                    title="Border Color"
                                >
                                    {showBorderPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                                </button>
                                <button
                                    className={cn("p-1.5 rounded transition-all relative", showRadiusPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                                    onClick={() => { const n = !showRadiusPicker; closeAllPanels(); setShowRadiusPicker(n); }}
                                    title="Corner Radius"
                                >
                                    <Circle size={14} />
                                    {showRadiusPicker && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                                </button>
                            </div>
                        )}

                        {isImage && (
                            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                                <button
                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                    onClick={() => {
                                        const cur = displayTarget.style.borderWidth || '0px';
                                        const n = cur === '0px' ? '2px' : '0px';
                                        applyStyle('borderStyle', 'solid');
                                        applyStyle('borderWidth', n);
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#000000');
                                    }}
                                    title="Border Toggle"
                                >
                                    <Square size={14} />
                                </button>
                                <button
                                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).borderColor }}
                                    onClick={() => { const n = !showBorderPalette; closeAllPanels(); setShowBorderPalette(n); }}
                                    title="Border Color"
                                >
                                    {showBorderPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                                </button>
                                <button
                                    className={cn("p-1.5 rounded transition-all relative", showRadiusPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                                    onClick={() => { const n = !showRadiusPicker; closeAllPanels(); setShowRadiusPicker(n); }}
                                    title="Corner Radius"
                                >
                                    <Circle size={14} />
                                    {showRadiusPicker && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                                </button>
                                <button
                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                    onClick={() => setImageCropMode(true, displayTarget.id)}
                                    title="Crop"
                                >
                                    <Scissors size={14} />
                                </button>
                                <button
                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                    onClick={handleRemoveBackground}
                                    title="Remove Background"
                                >
                                    <Eraser size={14} />
                                </button>
                                <button
                                    className={cn("p-1.5 rounded transition-all", showImagePicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                                    onClick={() => { const n = !showImagePicker; closeAllPanels(); setShowImagePicker(n); }}
                                    title="Replace Image"
                                >
                                    <ImagePlus size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 px-1">
                            <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all" onClick={() => useEditorStore.getState().setLayerSidebarOpen(true)} title="Show in Layers"><Layers size={14} /></button>
                            <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all" onClick={handleDuplicate} title="Duplicate"><Copy size={14} /></button>
                            <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all" onClick={handleDelete} title="Delete"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FloatingMenu;
