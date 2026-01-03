import React, { useRef } from 'react';
import {
    Circle,
    Trash2,
    ImagePlus,
    Square,
    Scissors,
} from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { cn } from '@/utils/cn';
import { useFloatingMenu } from '@/hooks/useFloatingMenu';
import ColorPalette from './floating-menu/ColorPalette';
import ImagePositionPanel from './floating-menu/ImagePositionPanel';
import RadiusPicker from './floating-menu/RadiusPicker';
import ImageReplacePanel from './floating-menu/ImageReplacePanel';
import TextSettings from './floating-menu/TextSettings';
import ParagraphSettings from './floating-menu/ParagraphSettings';
import EffectSettings from './floating-menu/EffectSettings';
import MenuHeader from './floating-menu/MenuHeader';
import GroupActions from './floating-menu/GroupActions';
import type { SelectionMode } from '@/hooks/moveable/useSelection';

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
    selectionMode: SelectionMode;
    activeSubTarget: HTMLElement | null;
    onClearSelection?: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate, selectionMode, activeSubTarget, onClearSelection }) => {
    const { imageFiles, imageUrls } = useAssets();
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        rect, target, targetType, isGrouped, canGroup, groupId,
        showImagePicker, setShowImagePicker,
        showCropPicker, setShowCropPicker,
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
        applyStyle, handleGroup, handleUngroup, handleDelete, toggleBold, openEyeDropper, closeAllPanels
    } = useFloatingMenu(targets, onUpdate, onClearSelection);

    if (!rect || !target) return null;

    const displayTarget = selectionMode === 'individual' && activeSubTarget ? activeSubTarget : target;

    const handleCopyId = () => {
        if (displayTarget.id) navigator.clipboard.writeText(displayTarget.id);
    };

    const handleCopyGroupId = () => {
        if (groupId) navigator.clipboard.writeText(groupId);
    };

    const isText = targetType === 'text';
    const isImage = targetType === 'image';
    const isShape = targetType === 'shape';

    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex flex-col gap-1",
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
                isGrouped={isGrouped}
                canGroup={canGroup}
                onCopyId={handleCopyId}
                onCopyGroupId={handleCopyGroupId}
            />

            {(canGroup || (selectionMode === 'group' && isGrouped)) ? (
                <GroupActions
                    isGrouped={isGrouped}
                    canGroup={canGroup}
                    onGroup={handleGroup}
                    onUngroup={handleUngroup}
                    onDelete={handleDelete}
                />
            ) : (
                <>
                    {/* Floating Panels */}
                    {showColorPalette && <ColorPalette type="color" onPick={openEyeDropper} onApply={applyStyle} />}
                    {showBgPalette && <ColorPalette type="backgroundColor" onPick={openEyeDropper} onApply={applyStyle} />}
                    {showBorderPalette && <ColorPalette type="borderColor" onPick={openEyeDropper} onApply={applyStyle} />}
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
                    {showCropPicker && isImage && <ImagePositionPanel target={displayTarget} onUpdate={onUpdate} />}
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
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#ffffff');
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
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#ffffff');
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
                                    className={cn("p-1.5 rounded transition-all", showCropPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                                    onClick={() => { const n = !showCropPicker; closeAllPanels(); setShowCropPicker(n); }}
                                    title="Crop"
                                >
                                    <Scissors size={14} />
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
                            <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all" onClick={handleDelete} title="Delete"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FloatingMenu;
