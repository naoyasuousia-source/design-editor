import { toPng } from 'html-to-image';

/**
 * デザイン領域のスクリーンショットを Base64 形式で取得する
 */
export const captureCanvas = async (element: HTMLElement): Promise<string | null> => {
    try {
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
        });
        return dataUrl;
    } catch (err) {
        console.error('Failed to capture canvas:', err);
        return null;
    }
};
