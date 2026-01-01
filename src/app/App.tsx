import React, { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Workspace from '@/components/features/Workspace';
import ComparisonView from '@/components/features/ComparisonView';
import TemporaryBar from '@/components/common/TemporaryBar';
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
        pendingContent
    } = useEditorStore();

    const [showComparison, setShowComparison] = useState(false);

    // ショートカットキーの有効化
    useHotkeys();
    // 終了警告の有効化
    useBeforeUnload();

    return (
        <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
            {/* メニューバー */}
            <Navbar />

            {/* メインコンテンツ領域 */}
            <main className="flex-1 relative overflow-hidden">
                {/* デザイン領域 */}
                <Workspace isLocked={isLocked || showComparison} />

                {/* 比較ビュー（オーバーレイ） */}
                {showComparison && (
                    <ComparisonView
                        onClose={() => setShowComparison(false)}
                        oldImage={pendingSnapshot || undefined}
                        newHtml={pendingContent}
                    />
                )}
            </main>

            {/* 一時バー（AI更新検知時のみ表示） */}
            {hasPendingChanges && !showComparison && (
                <TemporaryBar
                    onApprove={approveUpdate}
                    onDiscard={discardUpdate}
                    onCompare={() => setShowComparison(true)}
                />
            )}
        </div>
    );
};

export default App;
