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
        applyStyle,
        handleGroup,
        handleUngroup,
        toggleBold,
        openEyeDropper,
        closeAllPanels
    } = useFloatingMenu(targets, onUpdate, onClearSelection);

    if (!rect || !target) return null;

    // 個別選択モードの場合は、activeSubTarget を使用
    const displayTarget = selectionMode === 'individual' && activeSubTarget ? activeSubTarget : target;

    const tagName = displayTarget.tagName.toLowerCase();
    const isImage = tagName === 'img' || (displayTarget.style.backgroundImage && displayTarget.style.backgroundImage.includes('url'));

    // テキスト要素の判定
    const isText = !isImage &&
        displayTarget.textContent?.trim() !== '' &&
        (displayTarget.children.length === 0 ||
            Array.from(displayTarget.children).every(c =>
                ['br', 'span'].includes(c.tagName.toLowerCase()) ||
                (['div', 'p'].includes(c.tagName.toLowerCase()) && !c.id)
            ));

    const isShape = !isImage && !isText;

    // すべての選択要素が同じグループIDを持っているかどうか
    const firstGroupId = targets[0]?.getAttribute('data-group-id');
    const isGrouped = targets.length > 1 &&
        firstGroupId !== null &&
        targets.every(el => el.getAttribute('data-group-id') === firstGroupId);

    // 複数選択で、まだグループ化されていない（または異なるグループが混在している）場合
    const canGroup = targets.length > 1 && !isGrouped;

    // モード判定の整理
    const isExistingGroupMode = selectionMode === 'group' && isGrouped;

    // グループIDを取得
    const groupId = isGrouped ? firstGroupId : null;

    const handleCopyId = () => {
        if (!displayTarget.id) return;
        navigator.clipboard.writeText(displayTarget.id);
    };

    const handleCopyGroupId = () => {
        if (!groupId) return;
        navigator.clipboard.writeText(groupId);
    };

    // メニューは常に要素の上辺に表示
    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]",
                "flex-col"
            )}
            style={{
                bottom: `${window.innerHeight - rect.top + 8}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
            }}
        >
            {/* ヘッダーの描画 */}
            {isExistingGroupMode ? (
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-orange-500/30 bg-orange-500/10 rounded-t-md">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <Group size={12} className="text-orange-400" />
                        <span className="text-[10px] font-mono text-orange-300 truncate">
                            Group: {groupId}
                        </span>
                    </div>
                    <button
                        onClick={handleCopyGroupId}
                        className="p-1 hover:bg-orange-500/20 rounded text-orange-400 hover:text-orange-200 transition-all"
                        title="Copy Group ID"
                    >
                        <Copy size={10} />
                    </button>
                </div>
            ) : canGroup ? (
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-blue-500/30 bg-blue-500/10 rounded-t-md">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <Group size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300 truncate">
                            複数要素選択中
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/5 bg-white/5 rounded-t-md">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <Hash size={10} className="text-gray-500" />
                        <span className="text-[10px] font-mono text-gray-400 truncate">
                            {displayTarget.id || 'no-id'}
                        </span>
                    </div>
                    {displayTarget.id && (
                        <button onClick={handleCopyId} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all">
                            <Copy size={10} />
                        </button>
                    )}
                </div>
            )}

            {/* メニュー内容の描画 */}
            {canGroup ? (
                <div className="flex items-center gap-1 p-1">
                    <button
                        className="p-1.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1"
                        onClick={handleGroup}
                        title="Group All"
                    >
                        <Group size={14} />
                        <span className="text-xs font-bold">グループ化</span>
                    </button>
                    <button
                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
                        onClick={() => { targets.forEach(el => el.remove()); onUpdate(); }}
                        title="Delete All"
                    >
                        <Trash2 size={14} />
                        <span className="text-xs font-bold">削除</span>
                    </button>
                </div>
            ) : isExistingGroupMode ? (
                <div className="flex items-center gap-1 p-1">
                    <button
                        className="p-1.5 hover:bg-orange-500/20 rounded text-orange-400 hover:text-orange-300 transition-all flex items-center gap-1"
                        onClick={handleUngroup}
                        title="Ungroup"
                    >
                        <Ungroup size={14} />
                        <span className="text-xs font-bold">解除</span>
                    </button>
                    <button
                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all flex items-center gap-1"
                        onClick={() => { targets.forEach(el => el.remove()); onUpdate(); }}
                        title="Delete Group"
                    >
                        <Trash2 size={14} />
                        <span className="text-xs font-bold">全削除</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* 個別選択モード：従来のメニュー表示 */}
                    {showColorPalette && <ColorPalette type="color" onPick={openEyeDropper} onApply={applyStyle} />}
                    {showBgPalette && <ColorPalette type="backgroundColor" onPick={openEyeDropper} onApply={applyStyle} />}
                    {showBorderPalette && <ColorPalette type="borderColor" onPick={openEyeDropper} onApply={applyStyle} />}
                    {showShadowPalette && (
                        <ColorPalette
                            type="shadow"
                            onPick={() => openEyeDropper((v: string) => {
                                const style = window.getComputedStyle(displayTarget);
                                const current = displayTarget.style.textShadow || style.textShadow;
                                const parts = current.split(' ');
                                const nums = parts.filter(p => p.includes('px'));
                                applyStyle('textShadow' as any, `${nums.join(' ')} ${v} `);
                            })}
                            onApply={(_, v) => {
                                const style = window.getComputedStyle(displayTarget);
                                const current = displayTarget.style.textShadow || style.textShadow;
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
                            target={displayTarget}
                            onApply={applyStyle}
                            onUpdate={onUpdate}
                        />
                    )}

                    {showEffectSettings && isText && (
                        <EffectSettings
                            target={displayTarget}
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

                    {showCropPicker && isImage && <ImagePositionPanel target={displayTarget} onUpdate={onUpdate} />}

                    {showRadiusPicker && (
                        <RadiusPicker
                            target={displayTarget}
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
                            target={displayTarget}
                            onClose={() => setShowImagePicker(false)}
                            onUpdate={onUpdate}
                        />
                    )}

                    <div className="flex items-center gap-1 p-1">
                        {isText && (
                            <TextSettings
                                target={displayTarget}
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
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).backgroundColor }}
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
                                        const current = displayTarget.style.borderWidth || '0px';
                                        const next = current === '0px' ? '2px' : '0px';
                                        applyStyle('borderStyle', 'solid');
                                        applyStyle('borderWidth', next);
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#ffffff');
                                    }}
                                    title="Border Toggle"
                                >
                                    <Square size={14} />
                                </button>

                                <button
                                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).borderColor }}
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
                            </div>
                        )}

                        {isImage && (
                            <div className="flex items-center gap-1 px-1 border-r border-white/5">
                                <button
                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                    onClick={() => {
                                        const current = displayTarget.style.borderWidth || '0px';
                                        const next = current === '0px' ? '2px' : '0px';
                                        applyStyle('borderStyle', 'solid');
                                        applyStyle('borderWidth', next);
                                        if (!displayTarget.style.borderColor) applyStyle('borderColor', '#ffffff');
                                    }}
                                    title="Border Toggle"
                                >
                                    <Square size={14} />
                                </button>
                                <button
                                    className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                    style={{ backgroundColor: window.getComputedStyle(displayTarget).borderColor }}
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
                                        const current = displayTarget.style.borderRadius || '0px';
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
                            <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all" onClick={() => { targets.forEach(el => el.remove()); onUpdate(); }} title="Delete"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FloatingMenu;
