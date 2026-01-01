import React, { useEffect, useState, useRef } from 'react';
import {
    Type,
    Palette,
    Type as TypeIcon,
    Maximize2,
    Image as ImageIcon,
    Square,
    Circle,
    Copy,
    Trash2,
    Group,
    Ungroup
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { EDITOR_FONTS } from '@/constants/editor';

interface FloatingMenuProps {
    targets: HTMLElement[];
    onUpdate: () => void;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ targets, onUpdate }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
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

        // Observer for target changes
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

    const applyStyle = (property: string, value: string) => {
        targets.forEach(el => {
            (el.style as any)[property] = value;
        });
        onUpdate();
    };

    const applyAttribute = (name: string, value: string) => {
        targets.forEach(el => {
            el.setAttribute(name, value);
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
            className="fixed z-[100] bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: `${rect.top - 50}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translateX(-50%)',
            }}
        >
            {/* テキスト操作 */}
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
                            value={Math.round(parseFloat(window.getComputedStyle(target).fontSize))}
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
                        {/* 枠線 */}
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
                        <input
                            type="color"
                            className="w-5 h-5 bg-transparent border-none cursor-pointer p-0"
                            value={rgbToHex(window.getComputedStyle(target).borderColor)}
                            onChange={(e) => applyStyle('borderColor', e.target.value)}
                        />
                        {/* 角丸 */}
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
                    </div>
                </>
            )}

            {/* 共通操作 */}
            <div className="flex items-center gap-1 px-1">
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
    );
};

// ヘルパー関数: RGBをHexに変換
function rgbToHex(rgb: string) {
    if (!rgb || rgb === 'initial' || rgb === 'transparent') return '#ffffff';
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#ffffff';
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default FloatingMenu;
