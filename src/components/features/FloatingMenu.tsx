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
    Maximize
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useAssets } from '@/hooks/useAssets';
import { cn } from '@/utils/cn';
import { EDITOR_FONTS } from '@/constants/editor';

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showCropPicker, setShowCropPicker] = useState(false);
    const { imageFiles, imageUrls } = useAssets();
    const { isResponsiveResize, setResponsiveResize } = useEditorStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const target = targets[0]; // 最初の要素を基準にする

    useEffect(() => {
        if (!target) return;

        const updateRect = () => {
            setRect(target.getBoundingClientRect());
        };

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
            // camelCase を kebab-case に変換
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

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]"
            style={{
                top: `${rect.top - 60}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
            }}
        >
            {/* 要素 ID 表示チャネル */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/5 bg-white/5 rounded-t-md">
                <Hash size={10} className="text-gray-500" />
                <span className="text-[10px] font-mono text-gray-400 truncate">
                    {targets.length > 1 ? `${targets.length} elements selected` : target.id || 'no-id'}
                </span>
            </div>

            <div className="flex items-center gap-1">
                {isText && (
                    <>
                        <div className="flex items-center gap-1 px-1 border-r border-white/5">
                            <select
                                className="bg-transparent text-[10px] text-gray-300 hover:text-white outline-none cursor-pointer max-w-[100px] py-1"
                                value={target.style.fontFamily.replace(/['"]/g, '')}
                                onChange={(e) => applyStyle('fontFamily', e.target.value)}
                            >
                                {EDITOR_FONTS.map(f => (
                                    <option key={f.value} value={f.value} className="bg-sidebar">{f.label}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="w-12 bg-transparent text-[10px] text-gray-300 hover:text-white outline-none py-1 pl-1"
                                value={Math.round(parseFloat(window.getComputedStyle(target).fontSize) || 16)}
                                onChange={(e) => applyStyle('fontSize', `${e.target.value}px`)}
                            />
                        </div>
                        <div className="flex items-center gap-1 px-1 border-r border-white/5">
                            <input
                                type="color"
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0"
                                value={rgbToHex(window.getComputedStyle(target).color)}
                                onChange={(e) => applyStyle('color', e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* 画像操作 */}
                {isImage && (
                    <>
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
                                title="Border"
                            >
                                <Square size={14} />
                            </button>
                            <input
                                type="color"
                                className="w-5 h-5 bg-transparent border-none cursor-pointer p-0"
                                value={rgbToHex(window.getComputedStyle(target).borderColor)}
                                onChange={(e) => applyStyle('borderColor', e.target.value)}
                            />
                            <button
                                className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-all"
                                onClick={() => {
                                    const current = target.style.borderRadius || '0px';
                                    const next = current === '0px' ? '8px' : current === '8px' ? '9999px' : '0px';
                                    applyStyle('borderRadius', next);
                                }}
                                title="Border Radius"
                            >
                                <Circle size={14} />
                            </button>
                            <button
                                className={cn(
                                    "p-1.5 rounded transition-all",
                                    showCropPicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                                onClick={() => {
                                    setShowCropPicker(!showCropPicker);
                                    setShowImagePicker(false);
                                    if (!target.style.objectFit) target.style.objectFit = 'cover';
                                }}
                                title="Positioning (Crop)"
                            >
                                <Scissors size={14} />
                            </button>
                            <button
                                className={cn(
                                    "p-1.5 rounded transition-all",
                                    showImagePicker ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                                onClick={() => {
                                    setShowImagePicker(!showImagePicker);
                                    setShowCropPicker(false);
                                }}
                                title="Replace Image"
                            >
                                <ImagePlus size={14} />
                            </button>
                        </div>
                    </>
                )}

                {/* 共通操作 */}
                <div className="flex items-center gap-1 px-1">
                    {targets.length === 1 && target.children.length > 0 && (
                        <button
                            className={cn(
                                "p-1.5 rounded transition-all",
                                isResponsiveResize ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                            onClick={() => setResponsiveResize(!isResponsiveResize)}
                            title="Responsive Resize (Scale children proportionally)"
                        >
                            <Maximize size={14} />
                        </button>
                    )}
                    {canGroup && (
                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-blue-400 transition-all"
                            onClick={handleGroup}
                            title="Group"
                        >
                            <Group size={14} />
                        </button>
                    )}
                    {isGrouped && (
                        <button
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-orange-400 transition-all"
                            onClick={handleUngroup}
                            title="Ungroup"
                        >
                            <Ungroup size={14} />
                        </button>
                    )}
                    <button
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all"
                        onClick={() => {
                            targets.forEach(el => el.remove());
                            onUpdate();
                        }}
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* ポジショニング（トリミング）パネル */}
            {showCropPicker && isImage && (
                <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-white/5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Image Positioning</span>
                    <div className="flex flex-col gap-3 p-2 bg-black/20 rounded">
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-gray-500">
                                <span>Horizontal</span>
                                <span>{target.style.objectPosition.split(' ')[0] || '50%'}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
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
                                type="range"
                                min="0"
                                max="100"
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

            {/* 画像ピッカー */}
            {showImagePicker && isImage && (
                <div className="p-2 border-t border-white/5 grid grid-cols-4 gap-1 max-h-32 overflow-y-auto CustomScrollbar bg-white/5">
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
                    {imageFiles.length === 0 && (
                        <div className="col-span-4 py-2 text-[10px] text-gray-600 italic text-center">No images in folder</div>
                    )}
                </div>
            )}
        </div>
    );
};

function rgbToHex(rgb: string) {
    if (!rgb || rgb === 'initial' || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#ffffff';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default FloatingMenu;
