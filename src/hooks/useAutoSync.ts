import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

/**
 * 外部（AIなど）によるファイル変更を検知し、エディタに通知するフック
 * File System Access API を使用したポーリングによる検知を優先する
 */
export const useAutoSync = (canvasRef: React.RefObject<HTMLDivElement | null>) => {
    const {
        currentFileHandle,
        detectExternalUpdate,
        isLocked,
        hasPendingChanges
    } = useEditorStore();

    const lastModifiedRef = useRef<number>(0);
    const isLockedRef = useRef(false);

    // ref を更新してインターバル内で最新のステートを参照できるようにする
    useEffect(() => {
        isLockedRef.current = isLocked || hasPendingChanges;
    }, [isLocked, hasPendingChanges]);

    useEffect(() => {
        if (!currentFileHandle) return;

        const checkFile = async () => {
            // 他の承認フローが実行中の場合はチェックをスキップ
            if (isLockedRef.current) return;

            try {
                const file = await currentFileHandle.getFile();
                const currentModified = file.lastModified;

                // 変更を検知
                if (currentModified > lastModifiedRef.current) {

                    // 自己保存直後の場合は無視する（3秒以内のバッファ）
                    if (Date.now() - useEditorStore.getState().lastSaveTime < 3000) {
                        lastModifiedRef.current = currentModified;
                        return;
                    }

                    // 1. まず現在のキャンバスをスクショ
                    const canvasElement = canvasRef.current?.querySelector('.DesignSurface') as HTMLElement;
                    let snapshot = null;
                    if (canvasElement) {
                        try {
                            const { captureCanvas } = await import('@/utils/screenshot');
                            snapshot = await captureCanvas(canvasElement);
                        } catch (captureErr) {
                            console.warn('Snapshot capture failed:', captureErr);
                        }
                    }

                    // 2. 新しい内容を読み込む
                    const newContent = await file.text();

                    // 3. ストアに通知
                    detectExternalUpdate(newContent, snapshot);

                    // レンダリング時間を考慮して適用中表示を消す
                    setTimeout(() => {
                        useEditorStore.getState().setApplyingUpdate(false);
                    }, 600);

                    // 最後に検知した時刻を更新
                    lastModifiedRef.current = currentModified;
                }
            } catch (err) {
                console.warn('AutoSync polling error:', err);
            }
        };

        // 初期化時に現在の最終更新時刻を取得
        const initAndStart = async () => {
            try {
                const file = await currentFileHandle.getFile();
                lastModifiedRef.current = file.lastModified;

                // 初期化が終わってからチェックを開始する
                const interval = window.setInterval(checkFile, 1500);
                return interval;
            } catch (e) {
                console.error('Failed to initialize auto-sync polling:', e);
                return null;
            }
        };

        let activeInterval: number | null = null;
        initAndStart().then(interval => {
            activeInterval = interval;
        });

        return () => {
            if (activeInterval !== null) {
                window.clearInterval(activeInterval);
            }
        };
    }, [currentFileHandle, detectExternalUpdate]);

    // HMR 経由の検知もフォールバックとして残しておく
    useEffect(() => {
        // @ts-ignore
        if (import.meta.hot) {
            // @ts-ignore
            const unlisten = import.meta.hot.on('design-update', async (data: { fileName: string }) => {
                const { currentFileHandle, isLocked, hasPendingChanges, lastSaveTime } = useEditorStore.getState();

                if (isLocked || hasPendingChanges) return;

                // 自己保存直後の場合は無視する（3秒以内のバッファ）
                if (Date.now() - lastSaveTime < 3000) {
                    return;
                }

                if (currentFileHandle && currentFileHandle.name === data.fileName) {
                    // note: 現在は polling が 1.5s おきに動いているため、ここでは何もしない
                }
            });
            return unlisten;
        }
    }, []);
};
