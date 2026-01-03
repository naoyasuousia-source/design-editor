import { toPng } from 'html-to-image';

/**
 * デザイン領域のスクリーンショットを Base64 形式で取得する
 * CORS や SecurityError による失敗を許容し、null を返すことで処理を継続させる
 */
export const captureCanvas = async (element: HTMLElement): Promise<string | null> => {
    try {
        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            // フォントの読み込みやCSSのパースで SecurityError が発生しやすいため、
            // 同期プロセスを優先してこれらをスキップまたは制限する
            fontEmbedCSS: '',
            skipFonts: true,
        });
        return dataUrl;
    } catch (err) {
        // html-to-image の内部で発生したエラー（SecurityError 等）をここで食い止める
        console.warn('[captureCanvas] Failed to take snapshot. Comparison will proceed without image.', err);
        return null;
    }
};
