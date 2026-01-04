/**
 * 指定した要素群のバウンディングボックスを、指定したコンテナ基準で計算する（ズーム考慮）
 */
export const calculateGroupBounds = (elements: HTMLElement[], container: HTMLElement | null, zoom: number) => {
    if (elements.length === 0 || !container) return null;
    const cr = container.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(el => {
        const r = el.getBoundingClientRect();
        minX = Math.min(minX, r.left - cr.left);
        minY = Math.min(minY, r.top - cr.top);
        maxX = Math.max(maxX, r.right - cr.left);
        maxY = Math.max(maxY, r.bottom - cr.top);
    });

    // コンテナ自体が scale(zoom) されているので、CSS の left/top に指定する値は unscaled である必要がある
    return {
        left: minX / zoom,
        top: minY / zoom,
        width: (maxX - minX) / zoom,
        height: (maxY - minY) / zoom
    };
};
