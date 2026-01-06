import type { LayerData, LayerType } from '@/types/layer';

/**
 * HTML文字列からレイヤー一覧を抽出する
 * DOMの後の要素ほど前面にあるため、レイヤーリストとしては逆順（上が前面）にして返す
 */
export const parseLayers = (html: string): LayerData[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const surface = doc.querySelector('.DesignSurface') || doc.body;
    const children = Array.from(surface.children) as HTMLElement[];

    const layers: LayerData[] = [];
    const processedGroupIds = new Set<string>();

    children.forEach((el) => {
        const groupId = el.getAttribute('data-group-id');

        if (groupId) {
            if (processedGroupIds.has(groupId)) return;

            // グループ全体の要素を取得
            const groupElements = children.filter(child => child.getAttribute('data-group-id') === groupId);
            processedGroupIds.add(groupId);

            layers.push({
                id: el.id || `group - ${groupId} `,
                label: `グループ(${groupElements.length})`,
                type: 'group',
                groupId: groupId,
                elementIds: groupElements.map(e => e.id),
                isVisible: true,
                isLocked: false,
            });
        } else {
            const type = getElementType(el);
            layers.push({
                id: el.id,
                label: getElementLabel(el, type),
                type: type,
                groupId: null,
                elementIds: [el.id],
                isVisible: true,
                isLocked: false,
                style: el.getAttribute('style') || undefined,
                content: type === 'text' ? el.innerText : undefined,
                src: type === 'image' ? el.getAttribute('src') || undefined : undefined,
            });
        }
    });

    // 前面にあるもの（DOMの後ろ）をリストの上に持ってくる
    return layers.reverse();
};

/**
 * レイヤーの順序を更新したHTMLを生成する
 */
export const updateLayerOrder = (
    html: string,
    dragId: string,
    hoverId: string,
    position: 'above' | 'below' = 'below'
): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const surface = doc.querySelector('.DesignSurface') || doc.body;
    const children = Array.from(surface.children) as HTMLElement[];

    // 対象の要素群（グループ対応）を特定
    const findTarget = (id: string) => {
        const el = children.find(c => c.id === id);
        if (!el) return [];
        const gid = el.getAttribute('data-group-id');
        return gid ? children.filter(c => c.getAttribute('data-group-id') === gid) : [el];
    };

    const dragElements = findTarget(dragId);
    if (dragElements.length === 0) return html;

    // 非対象要素を抽出
    const remainingElements = children.filter(c => !dragElements.includes(c));

    // 挿入位置の特定
    const hoverIndex = remainingElements.findIndex(c => c.id === hoverId);

    if (hoverIndex !== -1) {
        // レイヤーリスト上では上が前面（DOMの後ろ）
        // position === 'above' (リストで上) -> DOM上で hoverId より後に挿入
        // position === 'below' (リストで下) -> DOM上で hoverId より前に挿入
        const insertIndex = position === 'above' ? hoverIndex + 1 : hoverIndex;
        remainingElements.splice(insertIndex, 0, ...dragElements);
    } else {
        remainingElements.push(...dragElements);
    }

    surface.innerHTML = '';
    remainingElements.forEach(el => surface.appendChild(el));

    return surface.classList.contains('DesignSurface') ? surface.outerHTML : surface.innerHTML;
};

const getElementType = (el: HTMLElement): LayerType => {
    if (el.tagName.toLowerCase() === 'img') return 'image';

    // テキストが含まれているか（子要素も含めてテキストがあるか）
    if (el.innerText.trim().length > 0) return 'text';

    // 背景色や境界線がある場合は図形とみなす
    const style = el.style;
    if (style.backgroundColor || style.backgroundImage || style.border || el.getAttribute('style')?.includes('background')) {
        return 'shape';
    }

    return 'unknown';
};

const getElementLabel = (el: HTMLElement, type: LayerType): string => {
    switch (type) {
        case 'text':
            const text = el.innerText.trim();
            return text.length > 10 ? `${text.substring(0, 10)}...` : text;
        case 'image':
            const src = (el as HTMLImageElement).src || '';
            const filename = src.split('/').pop() || '画像';
            return filename.length > 15 ? `画像: ${filename.substring(0, 10)}...` : `画像: ${filename} `;
        case 'shape':
            return '図形';
        default:
            return '要素';
    }
};
