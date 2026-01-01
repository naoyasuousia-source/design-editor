import React from 'react';
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
    Link2
} from 'lucide-react';
import { cn } from '@/utils/cn';

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
    return (
        <nav className="w-full bg-toolbar border-b border-white/5 p-2 z-50 shadow-premium">
            {/* 
        ウィンドウ幅に合わせてボタンが折り返されるように flex-wrap を使用。
        各アイテムは十分な余白を持ち、見切れないように配慮。
      */}
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

                {/* ボタン群 - セクションごとに区切り */}
                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton icon={<FilePlus />} label="新規作成" />
                    <NavButton icon={<FolderOpen />} label="開く" />
                    <NavButton icon={<Save />} label="保存" />
                    <NavButton icon={<Download />} label="上書き保存" />
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton icon={<ImageIcon />} label="画像として保存" />
                    <NavButton icon={<ZoomIn />} label="100%" />
                </div>

                <div className="flex flex-wrap items-center gap-1 border-l border-white/10 pl-4">
                    <NavButton icon={<Undo />} label="戻す" />
                    <NavButton icon={<Redo />} label="進む" />
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
