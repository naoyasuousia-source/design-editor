import React, { useState, useRef, useEffect } from 'react';
import {
    FilePlus,
    FolderOpen,
    Save,
    Image as ImageIcon,
    Undo,
    Redo,
    HelpCircle,
    Link2,
    ChevronDown,
    Plus,
    Brain,
    Layers,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEditorStore } from '@/store/useEditorStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useElementInsertion } from '@/hooks/useElementInsertion';
import MetaMessageEditor from '@/components/common/MetaMessageEditor';
import HintDialog from '@/components/common/HintDialog';
import ZoomControl from '@/components/common/ZoomControl';
import ImagePicker from '@/components/common/ImagePicker';
import NavButton from '@/components/common/navbar/NavButton';
import GuideArrow from '@/components/common/navbar/GuideArrow';
import type { PageSize } from '@/types/editor';
import { PAGE_SIZES } from '@/types/editor';



const Navbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMetaEditor, setShowMetaEditor] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isInsertOpen, setIsInsertOpen] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const insertRef = useRef<HTMLDivElement>(null);

    const {
        undo,
        redo,
        history,
        zoom,
        setZoom,
        setImageSaveMode,
        isImageSaveMode,
        isLayerSidebarOpen,
        setLayerSidebarOpen,
        currentFileHandle,
    } = useEditorStore();

    const { handleNew, handleOpen, handleOverwrite } = useFileSystem();
    const { insertText, insertImage } = useElementInsertion();

    const handleNewProject = (size: PageSize) => {
        handleNew(size);
        setIsDropdownOpen(false);
        setHasInteracted(true);
    };

    // 保存前にテキスト編集を確定
    const handleSave = async () => {
        const activeElement = document.activeElement as HTMLElement;

        if (activeElement && activeElement.contentEditable === 'true') {
            activeElement.blur();
            await new Promise(resolve => requestAnimationFrame(resolve));
            await handleOverwrite();
        } else {
            await handleOverwrite();
        }
    };

    // 外側クリックでドロップダウンを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (insertRef.current && !insertRef.current.contains(event.target as Node)) {
                setIsInsertOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav
            className="w-full bg-toolbar border-b border-white/5 p-2 z-[60] shadow-premium"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    useEditorStore.getState().triggerDeselect();
                }
            }}
        >
            <div
                className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-2"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        useEditorStore.getState().triggerDeselect();
                    }
                }}
            >
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
                            onClick={() => {
                                setIsDropdownOpen(!isDropdownOpen);
                                setHasInteracted(true);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300",
                                "text-sm font-medium transition-all duration-700",
                                !currentFileHandle
                                    ? "text-white bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                                    : "text-gray-300 hover:text-white hover:bg-white/10",
                                isDropdownOpen && "bg-white/10 text-white"
                            )}
                        >
                            <FilePlus className="w-4 h-4" />
                            <span>新規作成</span>
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>
                        {!currentFileHandle && !hasInteracted && <GuideArrow />}

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
                        onClick={() => {
                            handleOpen();
                            setHasInteracted(true);
                        }}
                        className={cn(
                            !currentFileHandle && "text-white bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20 delay-300"
                        )}
                    >
                        {!currentFileHandle && !hasInteracted && <GuideArrow />}
                    </NavButton>
                    <NavButton
                        icon={<Save />}
                        label="上書き保存"
                        onClick={handleSave}
                        disabled={isImageSaveMode || !currentFileHandle}
                    />
                    <NavButton
                        icon={<Layers />}
                        label="レイヤー"
                        onClick={() => setLayerSidebarOpen(!isLayerSidebarOpen)}
                        disabled={!currentFileHandle}
                        className={cn(isLayerSidebarOpen && "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary")}
                    />

                    {/* 挿入ドロップダウン */}
                    <div className="relative" ref={insertRef}>
                        <button
                            onClick={() => setIsInsertOpen(!isInsertOpen)}
                            disabled={!currentFileHandle}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
                                "text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10",
                                isInsertOpen && "bg-white/10 text-white",
                                "disabled:opacity-20"
                            )}
                        >
                            <Plus className="w-4 h-4 text-blue-400" />
                            <span>挿入</span>
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isInsertOpen && "rotate-180")} />
                        </button>

                        {isInsertOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-sidebar border border-white/10 rounded-lg shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => {
                                        insertText();
                                        setIsInsertOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <span className="w-4 h-4 text-xs font-bold border border-current rounded flex items-center justify-center">T</span>
                                    <span>テキストボックス</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowImagePicker(true);
                                        setIsInsertOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    <span>画像</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton
                        icon={<ImageIcon />}
                        label="画像として保存"
                        onClick={() => setImageSaveMode(true)}
                        disabled={isImageSaveMode || !currentFileHandle}
                    />
                    <ZoomControl zoom={zoom} onZoomChange={setZoom} disabled={!currentFileHandle} />
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton
                        icon={<Undo />}
                        label="戻す"
                        onClick={undo}
                        disabled={history.past.length === 0 || !currentFileHandle}
                    />
                    <NavButton
                        icon={<Redo />}
                        label="進む"
                        onClick={redo}
                        disabled={history.future.length === 0 || !currentFileHandle}
                    />
                </div>

                {/* AI 要件エリア */}
                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <button
                        onClick={() => setShowMetaEditor(true)}
                        disabled={!currentFileHandle}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-300 border border-blue-500/10 transition-all group disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>AIへの指示</span>
                    </button>
                    <NavButton
                        icon={<HelpCircle />}
                        label="ヒント"
                        className={cn(
                            "p-1 min-w-0 transition-all duration-700",
                            !currentFileHandle && "text-white bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20 delay-500"
                        )}
                        onClick={() => setShowHint(true)}
                    />
                </div>
            </div>

            {/* ダイアログ類 */}
            {showMetaEditor && (
                <MetaMessageEditor onClose={() => setShowMetaEditor(false)} />
            )}
            {showHint && (
                <HintDialog onClose={() => setShowHint(false)} />
            )}
            {showImagePicker && (
                <ImagePicker
                    onSelect={(path) => {
                        insertImage(path);
                        setShowImagePicker(false);
                    }}
                    onClose={() => setShowImagePicker(false)}
                />
            )}
        </nav>
    );
};

export default Navbar;
