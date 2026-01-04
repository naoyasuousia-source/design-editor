import React, { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Workspace from '@/components/features/workspace/Workspace';
import ComparisonView from '@/components/features/comparison/ComparisonView';
import TemporaryBar from '@/components/common/TemporaryBar';
import ImageSaveWizard from '@/components/features/image-save/ImageSaveWizard';
import SaveToast from '@/components/common/SaveToast';
import LayerSidebar from '@/components/features/layer/LayerSidebar';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useEditorStore } from '@/store/useEditorStore';

const App: React.FC = () => {
    const {
        isLocked,
        hasPendingChanges,
        approveUpdate,
        discardUpdate,
        pendingSnapshot,
        pendingContent,
        isImageSaveMode,
        showSaveToast,
        setShowSaveToast,
        currentFileHandle
    } = useEditorStore();

    const [showComparison, setShowComparison] = useState(false);

    // ショートカットキーの有効化
    useHotkeys();
    // 終了警告の有効化
    useBeforeUnload();

    // フォルダ・ファイルが選択されていない場合でも、NavbarとWorkspace（広告表示）を出す
    const isHome = !currentFileHandle;

    return (
        <div className="flex flex-col h-screen w-screen bg-background overflow-hidden relative">
            {/* メニューバー */}
            <Navbar />

            {/* メインコンテンツ領域 */}
            <main className="flex-1 relative overflow-hidden flex flex-row">
                <LayerSidebar />
                <div className="flex-1 relative h-full w-full flex flex-col overflow-hidden">
                    {/* デザイン領域（ホーム時はロック） */}
                    <Workspace isLocked={isLocked || showComparison || isHome} isHome={isHome} />

                    {/* 比較ビュー（オーバーレイ） */}
                    {showComparison && (
                        <ComparisonView
                            onClose={() => setShowComparison(false)}
                            oldImage={pendingSnapshot || undefined}
                            newHtml={pendingContent}
                        />
                    )}
                </div>
            </main>

            {/* 一時バー（AI更新検知時のみ表示） */}
            {hasPendingChanges && !showComparison && (
                <TemporaryBar
                    onApprove={approveUpdate}
                    onDiscard={discardUpdate}
                    onCompare={() => setShowComparison(true)}
                />
            )}

            {/* グローバルロックオーバーレイ (UIを触れなくする) */}
            {isLocked && !isImageSaveMode && !showComparison && (
                <div className="fixed inset-0 z-[80] bg-black/10 cursor-wait">
                    {/* 非表示だが、イベントをキャプチャして背後へのクリックを防ぐ */}
                </div>
            )}

            {/* 画像保存ウィザード */}
            {isImageSaveMode && <ImageSaveWizard />}

            {/* 保存成功トースト */}
            {showSaveToast && (
                <SaveToast message="上書き保存しました" onClose={() => setShowSaveToast(false)} />
            )}
        </div>
    );
};

export default App;
