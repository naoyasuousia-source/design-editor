import React, { useRef } from 'react';
import {
    Circle,
    Trash2,
    Group,
    Ungroup,
    ImagePlus,
    Hash,
    Scissors,
    Square,
    Maximize,
    Copy,
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

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate }) => {
    const { imageFiles, imageUrls } = useAssets();
    const menuRef = useRef<HTMLDivElement>(null);

    const {
        rect,
        target,
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
        isResponsiveResize, setResponsiveResize,
        applyStyle,
        handleGroup,
        handleUngroup,
        toggleBold,
        openEyeDropper,
        closeAllPanels
    } = useFloatingMenu(targets, onUpdate);

    if (!rect || !target) return null;

    const tagName = target.tagName.toLowerCase();
    const isImage = tagName === 'img' || (target.style.backgroundImage && target.style.backgroundImage.includes('url'));

    // Check if it's likely a text element (has text content and only basic organizational markup)
    // Heuristic: If children exist, they should not have an ID (which indicates a nested design element)
    const isText = !isImage &&
        target.textContent?.trim() !== '' &&
        (target.children.length === 0 ||
            Array.from(target.children).every(c =>
                ['br', 'span'].includes(c.tagName.toLowerCase()) ||
                (['div', 'p'].includes(c.tagName.toLowerCase()) && !c.id)
            ));

    const isShape = !isImage && !isText;

    const isGrouped = targets.every(el => el.hasAttribute('data-group-id')) && targets.length > 1;
    const canGroup = targets.length > 1 && !isGrouped;

    const handleCopyId = () => {
        if (!target.id) return;
        navigator.clipboard.writeText(target.id);
    };

    const growsUpwards = rect.top > 300;

    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]",
                growsUpwards ? "flex-col" : "flex-col-reverse"
            )}
            style={growsUpwards ? {
                bottom: `${window.innerHeight - rect.top + 8} px`,
                left: `${rect.left + rect.width / 2} px`,
                transform: 'translateX(-50%)',
            } : {
                top: `${rect.bottom + 8} px`,
                left: `${rect.left + rect.width / 2} px`,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/5 bg-white/5 rounded-t-md">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <Hash size={10} className="text-gray-500" />
                    <span className="text-[10px] font-mono text-gray-400 truncate">
                        {targets.length > 1 ? `${targets.length} elements selected` : target.id || 'no-id'}
                    </span>
                </div>
                {targets.length === 1 && target.id && (
                    <button onClick={handleCopyId} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all">
                        <Copy size={10} />
                    </button>
                )}
            </div>

            {showColorPalette && <ColorPalette type="color" onPick={openEyeDropper} onApply={applyStyle} />}
            {showBgPalette && <ColorPalette type="backgroundColor" onPick={openEyeDropper} onApply={applyStyle} />}
            {showBorderPalette && <ColorPalette type="borderColor" onPick={openEyeDropper} onApply={applyStyle} />}
            {showShadowPalette && (
                <ColorPalette
                    type="shadow"
                    onPick={() => openEyeDropper((v: string) => {
                        const style = window.getComputedStyle(target);
                        const current = target.style.textShadow || style.textShadow;
                        const parts = current.split(' ');
                        const nums = parts.filter(p => p.includes('px'));
                        applyStyle('textShadow' as any, `${nums.join(' ')} ${v} `);
                    })}
                    onApply={(_, v) => {
                        const style = window.getComputedStyle(target);
                        const current = target.style.textShadow || style.textShadow;
                        const parts = current.split(' ');
                        const nums = parts.filter(p => p.includes('px'));
                        applyStyle('textShadow' as any, `${nums.join(' ')} ${v} `);
                    }}
                />
            )}
            {showTextBgPalette && (
                <ColorPalette
                    type="backgroundColor"
                    onPick={() => openEyeDropper('backgroundColor')}
                    onApply={(_, v) => applyStyle('backgroundColor', v)}
                />
            )}
            {showStrokePalette && (
                <ColorPalette
                    type="stroke"
                    onPick={() => openEyeDropper((v: string) => applyStyle('webkitTextStrokeColor' as any, v))}
                    onApply={(_, v) => applyStyle('webkitTextStrokeColor' as any, v)}
                />
            )}

            {showParagraphSettings && isText && (
                <ParagraphSettings
                    target={target}
                    onApply={applyStyle}
                    onUpdate={onUpdate}
                />
            )}

            {showEffectSettings && isText && (
                <EffectSettings
                    target={target}
                    targets={targets}
                    showShadowPalette={showShadowPalette}
                    setShowShadowPalette={setShowShadowPalette}
                    showTextBgPalette={showTextBgPalette}
                    setShowTextBgPalette={setShowTextBgPalette}
                    showStrokePalette={showStrokePalette}
                    setShowStrokePalette={setShowStrokePalette}
                    onApply={applyStyle}
                    onUpdate={onUpdate}
                    closeAllPanels={closeAllPanels}
                />
            )}

            {showCropPicker && isImage && <ImagePositionPanel target={target} onUpdate={onUpdate} />}

            {showRadiusPicker && (
                <RadiusPicker
                    target={target}
                    localRadius={localRadius}
                    setLocalRadius={setLocalRadius}
                    onApply={applyStyle}
                    onUpdate={onUpdate}
                />
            )}

            {showImagePicker && isImage && (
                <ImageReplacePanel
                    imageFiles={imageFiles}
                    imageUrls={imageUrls}
                    target={target}
                    onClose={() => setShowImagePicker(false)}
                    onUpdate={onUpdate}
                />
            )}

            <div className="flex items-center gap-1 p-1">
                {isText && (
                    <TextSettings
                        target={target}
                        showSizeDropdown={showSizeDropdown}
                        setShowSizeDropdown={setShowSizeDropdown}
                        showColorPalette={showColorPalette}
                        setShowColorPalette={(show) => {
                            closeAllPanels();
                            setShowColorPalette(show);
                        }}
                        onApply={applyStyle}
                        onToggleBold={toggleBold}
                        showParagraphSettings={showParagraphSettings}
                        setShowParagraphSettings={(show) => {
                            closeAllPanels();
                            setShowParagraphSettings(show);
                        }}
                        showEffectSettings={showEffectSettings}
                        setShowEffectSettings={(show) => {
                            closeAllPanels();
                            setShowEffectSettings(show);
                        }}
                    />
                )}

                {isShape && (
                    <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        <button
                            className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                            style={{ backgroundColor: window.getComputedStyle(target).backgroundColor }}
                            onClick={() => {
                                const next = !showBgPalette;
                                closeAllPanels();
                                setShowBgPalette(next);
                            }}
                            title="Fill Color"
                        >
                            {showBgPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                        </button>

                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                            onClick={() => {
                                const current = target.style.borderWidth || '0px';
                                const next = current === '0px' ? '2px' : '0px';
                                applyStyle('borderStyle', 'solid');
                                applyStyle('borderWidth', next);
                                if (!target.style.borderColor) applyStyle('borderColor', '#ffffff');
                            }}
                            title="Border Toggle"
                        >
                            <Square size={14} />
                        </button>

                        <button
                            className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                            style={{ backgroundColor: window.getComputedStyle(target).borderColor }}
                            onClick={() => {
                                const next = !showBorderPalette;
                                closeAllPanels();
                                setShowBorderPalette(next);
                            }}
                            title="Border Color"
                        >
                            {showBorderPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                        </button>

                        <button
                            className={cn("p-1.5 rounded transition-all relative", showRadiusPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                            onClick={() => {
                                const next = !showRadiusPicker;
                                closeAllPanels();
                                setShowRadiusPicker(next);
                            }}
                            title="Corner Radius"
                        >
                            <Circle size={14} />
                            {showRadiusPicker && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                        </button>

                        <button
                            className={cn(
                                "p-1.5 rounded transition-all",
                                isResponsiveResize ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                            onClick={() => setResponsiveResize(!isResponsiveResize)}
                            title="Responsive Resize"
                        >
                            <Maximize size={14} />
                        </button>
                    </div>
                )}

                {isImage && (
                    <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                            onClick={() => {
                                const current = target.style.borderWidth || '0px';
                                const next = current === '0px' ? '2px' : '0px';
                                applyStyle('borderStyle', 'solid');
                                applyStyle('borderWidth', next);
                                if (!target.style.borderColor) applyStyle('borderColor', '#ffffff');
                            }}
                            title="Border Toggle"
                        >
                            <Square size={14} />
                        </button>
                        <button
                            className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                            style={{ backgroundColor: window.getComputedStyle(target).borderColor }}
                            onClick={() => {
                                const next = !showBorderPalette;
                                closeAllPanels();
                                setShowBorderPalette(next);
                            }}
                            title="Border Color"
                        >
                            {showBorderPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                        </button>
                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                            onClick={() => {
                                const current = target.style.borderRadius || '0px';
                                const next = current === '0px' ? '8px' : current === '8px' ? '9999px' : '0px';
                                applyStyle('borderRadius', next);
                            }}
                            title="Corner Radius"
                        >
                            <Circle size={14} />
                        </button>
                        <button
                            className={cn("p-1.5 rounded transition-all", showCropPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                            onClick={() => {
                                const next = !showCropPicker;
                                closeAllPanels();
                                setShowCropPicker(next);
                            }}
                            title="Crop"
                        >
                            <Scissors size={14} />
                        </button>
                        <button
                            className={cn("p-1.5 rounded transition-all", showImagePicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                            onClick={() => {
                                const next = !showImagePicker;
                                closeAllPanels();
                                setShowImagePicker(next);
                            }}
                            title="Replace Image"
                        >
                            <ImagePlus size={14} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1 px-1">
                    {canGroup && <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-blue-400 transition-all" onClick={handleGroup} title="Group"><Group size={14} /></button>}
                    {isGrouped && <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-orange-400 transition-all" onClick={handleUngroup} title="Ungroup"><Ungroup size={14} /></button>}
                    <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all" onClick={() => { targets.forEach(el => el.remove()); onUpdate(); }} title="Delete"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export default FloatingMenu;
