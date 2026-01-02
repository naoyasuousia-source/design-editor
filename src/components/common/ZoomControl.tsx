import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { getAvailableZoomLevels, getNextZoomLevel, getPreviousZoomLevel } from '@/utils/zoomLevels';

interface ZoomControlProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

/**
 * ズーム倍率コントロールコンポーネント
 * - +/- ボタンで次の倍率に変更
 * - 倍率表示をクリックするとドロップダウンで全倍率を表示
 */
const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, onZoomChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const availableLevels = getAvailableZoomLevels();

    // 外側クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const handleZoomIn = () => {
        const nextZoom = getNextZoomLevel(zoom);
        onZoomChange(nextZoom);
    };

    const handleZoomOut = () => {
        const previousZoom = getPreviousZoomLevel(zoom);
        onZoomChange(previousZoom);
    };

    const handleSelectZoom = (level: number) => {
        onZoomChange(level);
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/10">
                {/* 縮小ボタン */}
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= availableLevels[0]}
                    className={cn(
                        "w-6 h-6 flex items-center justify-center rounded transition-colors",
                        "text-gray-400 hover:text-white hover:bg-white/10",
                        "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                    aria-label="縮小"
                >
                    -
                </button>

                {/* 倍率表示（クリックでドロップダウン） */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                        "text-[11px] font-mono text-gray-300 w-12 text-center",
                        "hover:text-white transition-colors cursor-pointer",
                        "px-1 py-0.5 rounded hover:bg-white/10"
                    )}
                    aria-label="倍率選択"
                >
                    {Math.round(zoom * 100)}%
                </button>

                {/* 拡大ボタン */}
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= availableLevels[availableLevels.length - 1]}
                    className={cn(
                        "w-6 h-6 flex items-center justify-center rounded transition-colors",
                        "text-gray-400 hover:text-white hover:bg-white/10",
                        "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                    aria-label="拡大"
                >
                    +
                </button>
            </div>

            {/* ドロップダウンメニュー */}
            {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-sidebar border border-white/10 rounded-lg shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto">
                    {availableLevels.map((level) => {
                        const isActive = Math.abs(zoom - level) < 0.01;

                        return (
                            <button
                                key={level}
                                onClick={() => handleSelectZoom(level)}
                                className={cn(
                                    "w-full text-left px-4 py-1.5 text-sm transition-colors",
                                    "hover:bg-primary hover:text-white",
                                    "font-mono",
                                    isActive && "bg-primary/20 text-white font-semibold"
                                )}
                            >
                                {Math.round(level * 100)}%
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ZoomControl;
