import React, { useEffect, useState, useRef } from 'react';
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
    Bold,
    Copy,
    Pipette,
    ChevronDown
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useAssets } from '@/hooks/useAssets';
import { cn } from '@/utils/cn';
import { EDITOR_FONTS } from '@/constants/editor';

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
}

const COLOR_PALETTE = [
    ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#FFFFFF'],
    ['#FF0000', '#FF5E5E', '#FF71A8', '#E2A1F8', '#D258EE', '#9B51E0', '#6124B5'],
    ['#0097A7', '#2DCCFF', '#80E9FF', '#4DABFF', '#5E81AC', '#104E8B', '#001F3F'],
    ['#00C853', '#8BC34A', '#CCFF33', '#FFD54F', '#FFB74D', '#FF8A65', '#E65100']
];

const PRESET_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80, 96, 128];

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showCropPicker, setShowCropPicker] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showBorderPalette, setShowBorderPalette] = useState(false);
    const { imageFiles, imageUrls } = useAssets();
    const { isResponsiveResize, setResponsiveResize } = useEditorStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const target = targets[0];

    useEffect(() => {
        if (!target) return;
        const updateRect = () => setRect(target.getBoundingClientRect());
        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        const observer = new MutationObserver(updateRect);
        observer.observe(target, { attributes: true, subtree: true });
        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
            observer.disconnect();
        };
    }, [target]);

    if (!rect || !target) return null;

    const isText = target.innerText.trim().length > 0 && target.tagName.toLowerCase() !== 'img';
    const isImage = target.tagName.toLowerCase() === 'img' || target.style.backgroundImage;
    const isGrouped = targets.every(el => el.hasAttribute('data-group-id')) && targets.length > 1;
    const canGroup = targets.length > 1 && !isGrouped;

    const applyStyle = (property: keyof CSSStyleDeclaration, value: string) => {
        targets.forEach(el => {
            const cssProperty = (property as string).replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            el.style.setProperty(cssProperty, value);
        });
        onUpdate();
    };

    const handleGroup = () => {
        const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
        targets.forEach(el => el.setAttribute('data-group-id', groupId));
        onUpdate();
    };

    const handleUngroup = () => {
        targets.forEach(el => el.removeAttribute('data-group-id'));
        onUpdate();
    };

    const toggleBold = () => {
        const currentWeight = window.getComputedStyle(target).fontWeight;
        const isBold = currentWeight === 'bold' || parseInt(currentWeight) >= 700;
        applyStyle('fontWeight', isBold ? 'normal' : 'bold');
    };

    const handleCopyId = () => {
        if (!target.id) return;
        navigator.clipboard.writeText(target.id);
    };

    const openEyeDropper = async (property: 'color' | 'borderColor' = 'color') => {
        if (!('EyeDropper' in window)) {
            alert('Your browser does not support the EyeDropper API');
            return;
        }
        try {
            // @ts-ignore
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            applyStyle(property, result.sRGBHex);
        } catch (e) { console.error('EyeDropper failed:', e); }
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]"
            style={{
                bottom: `${window.innerHeight - rect.top + 8}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
            }}
        >
            {/* 1. ID Bar (Top) */}
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

            {/* 2. Color Palette Sub-panel */}
            {(showColorPalette || showBorderPalette) && (
                <div className="p-3 border-b border-white/10 flex flex-col gap-3 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                            {showColorPalette ? 'Text Color' : 'Border Color'}
                        </span>
                        <button
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white flex items-center gap-1 text-[10px]"
                            onClick={() => openEyeDropper(showColorPalette ? 'color' : 'borderColor')}
                        >
                            <Pipette size={12} />
                            <span>Pick</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {COLOR_PALETTE.map((row, i) => (
                            <div key={i} className="flex gap-1.5 justify-center">
                                {row.map(color => (
                                    <button
                                        key={color}
                                        className="w-5 h-5 rounded-full border border-white/10 hover:border-white hover:scale-110 transition-all shadow-md"
                                        style={{ backgroundColor: color }}
                                        onClick={() => applyStyle(showColorPalette ? 'color' : 'borderColor', color)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Image Positioning Sub-panel */}
            {showCropPicker && isImage && (
                <div className="p-3 border-b border-white/5 flex flex-col gap-2 bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Image Positioning</span>
                    <div className="flex flex-col gap-3 p-2 bg-black/20 rounded">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-gray-500">
                                <span>Horizontal</span>
                                <span>{target.style.objectPosition.split(' ')[0] || '50%'}</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                onChange={(e) => {
                                    const y = target.style.objectPosition.split(' ')[1] || '50%';
                                    target.style.objectPosition = `${e.target.value}% ${y}`;
                                    onUpdate();
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-gray-500">
                                <span>Vertical</span>
                                <span>{target.style.objectPosition.split(' ')[1] || '50%'}</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                onChange={(e) => {
                                    const x = target.style.objectPosition.split(' ')[0] || '50%';
                                    target.style.objectPosition = `${x} ${e.target.value}%`;
                                    onUpdate();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Image Replace Sub-panel */}
            {showImagePicker && isImage && (
                <div className="p-2 border-b border-white/5 grid grid-cols-4 gap-1 max-h-32 overflow-y-auto CustomScrollbar bg-white/5 animate-in slide-in-from-bottom-1 duration-200">
                    {imageFiles.map(file => (
                        <button
                            key={file}
                            className="aspect-square bg-black/20 rounded border border-white/5 hover:border-blue-500 overflow-hidden transition-all"
                            onClick={() => {
                                const path = `./images/${file}`;
                                if (target.tagName.toLowerCase() === 'img') {
                                    (target as HTMLImageElement).src = path;
                                } else {
                                    target.style.backgroundImage = `url('${path}')`;
                                }
                                setShowImagePicker(false);
                                onUpdate();
                            }}
                        >
                            <img src={imageUrls[file]} alt={file} className="w-full h-full object-contain" />
                        </button>
                    ))}
                    {imageFiles.length === 0 && <div className="col-span-4 py-2 text-[10px] text-gray-600 italic text-center">No images</div>}
                </div>
            )}

            {/* 5. Main Control Bar (Bottom) */}
            <div className="flex items-center gap-1 p-1">
                {isText && (
                    <>
                        <div className="flex items-center gap-1 px-1 border-r border-white/5">
                            <select
                                className="bg-transparent text-[10px] text-gray-300 hover:text-white outline-none cursor-pointer max-w-[80px] py-1"
                                value={target.style.fontFamily.replace(/['"]/g, '')}
                                onChange={(e) => applyStyle('fontFamily', e.target.value)}
                            >
                                {EDITOR_FONTS.map(f => (
                                    <option key={f.value} value={f.value} className="bg-[#1a1a1a] text-white">{f.label}</option>
                                ))}
                            </select>
                            <div className="relative flex items-center bg-white/5 rounded border border-white/10 hover:border-white/20 ml-1 group">
                                <input
                                    type="text"
                                    className="w-10 bg-transparent text-[10px] text-center text-gray-300 hover:text-white outline-none py-1"
                                    value={Math.round(parseFloat(window.getComputedStyle(target).fontSize) || 16)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val) applyStyle('fontSize', `${val}px`);
                                    }}
                                />
                                <div className="relative h-6 flex items-center border-l border-white/10 px-0.5 cursor-pointer">
                                    <ChevronDown size={10} className="text-gray-500 group-hover:text-white" />
                                    <select
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                        onChange={(e) => {
                                            if (e.target.value) applyStyle('fontSize', `${e.target.value}px`);
                                        }}
                                    >
                                        <option value="" className="bg-[#1a1a1a] text-white text-[8px]">-</option>
                                        {PRESET_FONT_SIZES.map(s => (
                                            <option key={s} value={s} className="bg-[#1a1a1a] text-white text-[8px]">{s}px</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 px-1 border-r border-white/5">
                            <button
                                className={cn("p-1.5 rounded transition-all", (window.getComputedStyle(target).fontWeight === 'bold' || parseInt(window.getComputedStyle(target).fontWeight) >= 700) ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                                onClick={toggleBold}
                            >
                                <Bold size={14} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 px-1 border-r border-white/5">
                            <button
                                className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                                style={{ backgroundColor: window.getComputedStyle(target).color }}
                                onClick={() => { setShowColorPalette(!showColorPalette); setShowBorderPalette(false); setShowCropPicker(false); setShowImagePicker(false); }}
                            >
                                {showColorPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                            </button>
                        </div>
                    </>
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
                        >
                            <Square size={14} />
                        </button>
                        <button
                            className="w-6 h-6 rounded border border-white/20 hover:border-white transition-all relative"
                            style={{ backgroundColor: window.getComputedStyle(target).borderColor }}
                            onClick={() => { setShowBorderPalette(!showBorderPalette); setShowColorPalette(false); setShowCropPicker(false); setShowImagePicker(false); }}
                        >
                            {showBorderPalette && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                        </button>
                        <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all" onClick={() => openEyeDropper('borderColor')}>
                            <Pipette size={14} />
                        </button>
                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                            onClick={() => {
                                const current = target.style.borderRadius || '0px';
                                const next = current === '0px' ? '8px' : current === '8px' ? '9999px' : '0px';
                                applyStyle('borderRadius', next);
                            }}
                        >
                            <Circle size={14} />
                        </button>
                        <button
                            className={cn("p-1.5 rounded transition-all", showCropPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                            onClick={() => { setShowCropPicker(!showCropPicker); setShowImagePicker(false); setShowColorPalette(false); setShowBorderPalette(false); }}
                        >
                            <Scissors size={14} />
                        </button>
                        <button
                            className={cn("p-1.5 rounded transition-all", showImagePicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
                            onClick={() => { setShowImagePicker(!showImagePicker); setShowCropPicker(false); setShowColorPalette(false); setShowBorderPalette(false); }}
                        >
                            <ImagePlus size={14} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1 px-1">
                    {targets.length === 1 && target.children.length > 0 && (
                        <button className={cn("p-1.5 rounded transition-all", isResponsiveResize ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")} onClick={() => setResponsiveResize(!isResponsiveResize)}>
                            <Maximize size={14} />
                        </button>
                    )}
                    {canGroup && <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-blue-400 transition-all" onClick={handleGroup}><Group size={14} /></button>}
                    {isGrouped && <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-orange-400 transition-all" onClick={handleUngroup}><Ungroup size={14} /></button>}
                    <button className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all" onClick={() => { targets.forEach(el => el.remove()); onUpdate(); }}><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export default FloatingMenu;
