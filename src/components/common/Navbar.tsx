import React, { useState, useRef, useEffect } from 'react';
import {
    FilePlus,
    FolderOpen,
    Save,
    Download,
    Image as ImageIcon,
    ZoomIn,
    Undo,
    Redo,
    MessageSquare,
    HelpCircle,
    Link2,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import type { PageSize } from '@/types/editor';
import { PAGE_SIZES } from '@/types/editor';

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick, className, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
            "text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            className
        )}
    >
        <span className="w-4 h-4">{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
    </button>
);

const Navbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        isDirty,
        setPageSize,
        reset,
        undo,
        redo,
        history,
        zoom,
        setZoom
    } = useEditorStore();

    const { openFolder, saveCurrentFile } = useFileSystem();

    const handleNewProject = (size: PageSize) => {
        if (isDirty) {
            if (!confirm('編集中の内容は破棄されます。よろしいですか？')) {
                return;
            }
        }
        reset();
        setPageSize(size);
        setIsDropdownOpen(false);
    };

    // 外側クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="w-full bg-toolbar border-b border-white/5 p-2 z-[60] shadow-premium">
            <div className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* ロゴエリア */}
                <div className="flex items-center gap-2 mr-4 py-1">
                    <div className="p-1.5 bg-primary rounded-lg">
                        <Link2 className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        AI-Link Design
                    </h1>
                </div>

                {/* ボタン群 */}
                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    {/* 新規作成ドロップダウン */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
                                "text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10",
                                isDropdownOpen && "bg-white/10 text-white"
                            )}
                        >
                            <FilePlus className="w-4 h-4" />
                            <span>新規作成</span>
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-sidebar border border-white/10 rounded-lg shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-top-2">
                                {(Object.keys(PAGE_SIZES) as PageSize[]).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => handleNewProject(size)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        {PAGE_SIZES[size].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <NavButton
                        icon={<FolderOpen />}
                        label="開く"
                        onClick={openFolder}
                    />
                    <NavButton
                        icon={<Save />}
                        label="保存"
                        onClick={() => alert('名前を付けて保存は未実装です。')}
                    />
                    <NavButton
                        icon={<Download />}
                        label="上書き保存"
                        onClick={saveCurrentFile}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton icon={<ImageIcon />} label="画像として保存" />
                    <button
                        onClick={() => setZoom(zoom === 1 ? 1.5 : zoom === 1.5 ? 2 : 1)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <ZoomIn className="w-4 h-4" />
                        <span>{Math.round(zoom * 100)}%</span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton
                        icon={<Undo />}
                        label="戻す"
                        onClick={undo}
                        disabled={history.past.length === 0}
                    />
                    <NavButton
                        icon={<Redo />}
                        label="進む"
                        onClick={redo}
                        disabled={history.future.length === 0}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton icon={<MessageSquare />} label="AIへの指示" />
                    <NavButton icon={<HelpCircle />} label="ヒント" className="p-1 min-w-0" />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
