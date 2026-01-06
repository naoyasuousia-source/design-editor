/**
 * 要素のスタイルを解析し、キャンバスサイズ内に強制的に収める
 */
export const sanitizeStyles = (styleStr: string, canvasWidth: number, canvasHeight: number): string => {
    const styles: Record<string, string> = {};
    styleStr.split(';').forEach(s => {
        const [k, v] = s.split(':').map(str => str.trim());
        if (k && v) styles[k.toLowerCase()] = v;
    });

    const getPx = (val: string | undefined): number | null => {
        if (!val) return null;
        const match = val.match(/^(-?\d+(\.\d+)?)px$/);
        return match ? parseFloat(match[1]) : null;
    };

    let left = getPx(styles['left']);
    let top = getPx(styles['top']);
    let width = getPx(styles['width']);
    let height = getPx(styles['height']);

    // 1. サイズのクランプ (キャンバスより大きくならないように)
    if (width !== null) width = Math.min(width, canvasWidth);
    if (height !== null) height = Math.min(height, canvasHeight);

    // 2. 座標のクランプと押し戻し (はみ出し防止)
    if (left !== null) {
        if (width !== null) {
            if (left + width > canvasWidth) left = canvasWidth - width;
        }
        left = Math.max(0, Math.min(left, canvasWidth));
    }

    if (top !== null) {
        if (height !== null) {
            if (top + height > canvasHeight) top = canvasHeight - height;
        }
        top = Math.max(0, Math.min(top, canvasHeight));
    }

    // スタイル文字列を再構築
    if (left !== null) styles['left'] = `${left}px`;
    if (top !== null) styles['top'] = `${top}px`;
    if (width !== null) styles['width'] = `${width}px`;
    if (height !== null) styles['height'] = `${height}px`;

    // z-index を削除（レイヤー順序は DOM 順序で管理するため）
    delete styles['z-index'];

    return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('; ');
};
