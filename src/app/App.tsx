import React, { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Workspace from '@/components/features/Workspace';
import ComparisonView from '@/components/features/ComparisonView';
import TemporaryBar from '@/components/common/TemporaryBar';

const App: React.FC = () => {
    const [isLocked] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);

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
                    <ComparisonView onClose={() => setShowComparison(false)} />
                )}
            </main>

            {/* 一時バー（AI更新検知時のみ表示） */}
            {hasPendingChanges && !showComparison && (
                <TemporaryBar
                    onApprove={() => setHasPendingChanges(false)}
                    onDiscard={() => setHasPendingChanges(false)}
                    onCompare={() => setShowComparison(true)}
                />
            )}
        </div>
    );
};

export default App;
