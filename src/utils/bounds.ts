/**
 * 指定した座標群のバウンディングボックスを計算する純粋関数
 */
export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/**
 * 複数の要素の Rect 群から、コンテナ基準のバウンディングボックスを算出する（ズーム考慮）
 */
export const calculateGroupBounds = (rects: Rect[], containerRect: Rect, zoom: number) => {
    if (rects.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    rects.forEach(r => {
        minX = Math.min(minX, r.left - containerRect.left);
        minY = Math.min(minY, r.top - containerRect.top);
        maxX = Math.max(maxX, r.right - containerRect.left);
        maxY = Math.max(maxY, r.bottom - containerRect.top);
    });

    return {
        left: minX / zoom,
        top: minY / zoom,
        width: (maxX - minX) / zoom,
        height: (maxY - minY) / zoom
    };
};
