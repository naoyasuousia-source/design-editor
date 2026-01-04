import React, { useState } from 'react';
import { FolderOpen, Plus, Sparkles, Layout, Zap, ArrowRight } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { fileSystemService } from '@/services/fileSystem';
import { constructFullHTML } from '@/utils/htmlProcessing';
import { DEFAULT_PAGE_SIZE } from '@/constants/editor';
import { cn } from '@/utils/cn';
import homeBg from '@/assets/home-bg.png';

const Home: React.FC = () => {
    const {
        setProjectDirectoryHandle,
        setCurrentFileHandle,
        setProjectFolderName,
        setContent,
        setPageSize,
        setMetaMessage
    } = useEditorStore();
    const [isHoveringNew, setIsHoveringNew] = useState(false);
    const [isHoveringOpen, setIsHoveringOpen] = useState(false);

    const handleOpenFolder = async () => {
        try {
            const folderHandle = await fileSystemService.selectProjectFolder();
            if (!folderHandle) return;

            setProjectDirectoryHandle(folderHandle);
            setProjectFolderName(folderHandle.name);

            // フォルダ内のデザインファイルを一覧表示するか、最初の一つを開く
            // ここでは簡易的に、ファイル選択ダイアログを表示する
            const { fileHandle, content } = await fileSystemService.openFileFromFolder(folderHandle);
            setCurrentFileHandle(fileHandle);
            setContent(content);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateNew = async () => {
        try {
            const folderHandle = await fileSystemService.selectProjectFolder();
            if (!folderHandle) return;

            setProjectDirectoryHandle(folderHandle);
            setProjectFolderName(folderHandle.name);

            const fileName = `design-${Date.now()}.html`;
            const template = constructFullHTML('', '', {
                pageSize: DEFAULT_PAGE_SIZE,
                fixedRules: '',
                collaborativeRules: '',
                designConcept: '',
                colors: { main: 'none', sub: 'none', accent: 'none' },
                colorKit: 'custom'
            });

            const fileHandle = await fileSystemService.createNewDesignFile(folderHandle, fileName, template);
            setCurrentFileHandle(fileHandle);
            setContent('');
            setPageSize(DEFAULT_PAGE_SIZE);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative h-screen w-screen bg-[#050505] overflow-hidden flex items-center justify-center font-sans">
            {/* Background with Image and Ambient Glow */}
            <div className="absolute inset-0 z-0">
                <img src={homeBg} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] opacity-80" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center">
                {/* Logo & Headline */}
                <div className="mb-16 text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 rotate-3 transform hover:rotate-0 transition-transform duration-500">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white bg-clip-text">
                            ANTIGRAVITY <span className="text-blue-500">EDITOR</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed font-light">
                        AIと共創する、次世代のデザインエディターツール。<br />
                        直感的な操作とAIの提案で、あなたの想像を超えるデザインを。
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                    {/* New Project Card */}
                    <button
                        onMouseEnter={() => setIsHoveringNew(true)}
                        onMouseLeave={() => setIsHoveringNew(false)}
                        onClick={handleCreateNew}
                        className={cn(
                            "group relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-8 text-left transition-all duration-500",
                            "hover:bg-white/[0.08] hover:border-blue-500/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]"
                        )}
                    >
                        <div className="relative z-20 space-y-4">
                            <div className="p-4 bg-blue-500/10 rounded-2xl w-fit group-hover:bg-blue-500/20 transition-colors">
                                <Plus className="text-blue-400 w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">新規作成</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    新しいプロジェクトを開始し、AIと共にゼロからデザインを構築します。
                                </p>
                            </div>
                            <div className="pt-4 flex items-center gap-2 text-blue-400 font-bold text-sm">
                                プロジェクトを開始 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Decorative Gradient */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 transition-opacity duration-500",
                            isHoveringNew ? "opacity-100" : ""
                        )} />
                    </button>

                    {/* Open Project Card */}
                    <button
                        onMouseEnter={() => setIsHoveringOpen(true)}
                        onMouseLeave={() => setIsHoveringOpen(false)}
                        onClick={handleOpenFolder}
                        className={cn(
                            "group relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-8 text-left transition-all duration-500",
                            "hover:bg-white/[0.08] hover:border-purple-500/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)]"
                        )}
                    >
                        <div className="relative z-20 space-y-4">
                            <div className="p-4 bg-purple-500/10 rounded-2xl w-fit group-hover:bg-purple-500/20 transition-colors">
                                <FolderOpen className="text-purple-400 w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">既存を開く</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    保存済みのプロジェクトフォルダから、デザインファイルを読み込みます。
                                </p>
                            </div>
                            <div className="pt-4 flex items-center gap-2 text-purple-400 font-bold text-sm">
                                ファイルを選択 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* Decorative Gradient */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 transition-opacity duration-500",
                            isHoveringOpen ? "opacity-100" : ""
                        )} />
                    </button>
                </div>

                {/* Footer Info */}
                <div className="mt-20 flex gap-8 text-center animate-in fade-in duration-1000 delay-500">
                    <div className="space-y-1">
                        <div className="text-white/60 text-xs uppercase tracking-widest font-bold flex items-center gap-2 justify-center">
                            <Layout size={12} /> Responsive
                        </div>
                        <div className="text-gray-500 text-[10px]">A4, SQUARE, 9:16 Support</div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="space-y-1">
                        <div className="text-white/60 text-xs uppercase tracking-widest font-bold flex items-center gap-2 justify-center">
                            <Zap size={12} /> Realtime
                        </div>
                        <div className="text-gray-500 text-[10px]">Auto-sync with AI workspace</div>
                    </div>
                </div>
            </div>

            {/* Version Info */}
            <div className="absolute bottom-8 right-12 text-white/20 text-[10px] font-mono tracking-tighter">
                ANTIGRAVITY EDITOR v1.0.4-BETA
            </div>
        </div>
    );
};

export default Home;
