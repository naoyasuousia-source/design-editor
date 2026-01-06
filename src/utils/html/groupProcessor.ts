/**
 * グループ化のロジックを適用し、不自然な重なりや単一要素のグループ化を整理する
 */
export const processGroups = (root: HTMLElement): void => {
    const children = Array.from(root.children) as HTMLElement[];
    const groups = new Map<string, HTMLElement[]>();

    // 1. 各グループの構成要素を収集
    children.forEach(el => {
        const groupId = el.getAttribute('data-group-id');
        if (groupId) {
            if (!groups.has(groupId)) {
                groups.set(groupId, []);
            }
            groups.get(groupId)!.push(el);
        }
    });

    // 2. 一つのみのグループ id は削除
    groups.forEach((elements, groupId) => {
        if (elements.length <= 1) {
            elements.forEach(el => el.removeAttribute('data-group-id'));
            groups.delete(groupId);
        }
    });

    // 3. グループの境界ボックスを計算し、グループ外の要素が入り込んでいないかチェック
    // 入り込んでいた場合、そのグループを最前面（DOMの最後）に移動して「追い出す」
    groups.forEach((elements, groupId) => {
        const bbox = calculateBoundingBox(elements);
        if (!bbox) return;

        const hasStrayElement = children.some(el => {
            const elGroupId = el.getAttribute('data-group-id');
            if (elGroupId === groupId) return false; // 自分のグループは除外

            const elBbox = getElementBbox(el);
            if (!elBbox) return false;

            // 部分的にでも重なっていれば「入り込んでいる」とみなす
            return isOverlapping(bbox, elBbox);
        });

        if (hasStrayElement) {
            // グループの構成要素の中で、DOM 上で最も高い（最後にある）要素を基準にする
            const currentChildren = Array.from(root.children) as HTMLElement[];
            const groupIndices = elements
                .map(el => currentChildren.indexOf(el))
                .sort((a, b) => a - b);

            const maxIdx = groupIndices[groupIndices.length - 1];
            const topmostElement = currentChildren[maxIdx];

            // 最前面の要素（topmostElement）の直前に、他の要素を順番に並べる
            // 最後の要素自身はその場に留まり、他の要素がその「下」に集まる形になる
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el !== topmostElement) {
                    root.insertBefore(el, topmostElement);
                }
            }
        }
    });
};

interface BBox {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

const getElementBbox = (el: HTMLElement): BBox | null => {
    const style = el.getAttribute('style') || '';
    const getPx = (prop: string): number => {
        const match = style.match(new RegExp(`${prop}:\\s*(-?\\d+(\\.\\d+)?)px`));
        return match ? parseFloat(match[1]) : 0;
    };

    const left = getPx('left');
    const top = getPx('top');
    const width = getPx('width');
    const height = getPx('height');

    if (width === 0 && height === 0) return null;

    return {
        top,
        left,
        right: left + width,
        bottom: top + height
    };
};

const calculateBoundingBox = (elements: HTMLElement[]): BBox | null => {
    let minTop = Infinity, minLeft = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    let found = false;

    elements.forEach(el => {
        const bbox = getElementBbox(el);
        if (bbox) {
            minTop = Math.min(minTop, bbox.top);
            minLeft = Math.min(minLeft, bbox.left);
            maxRight = Math.max(maxRight, bbox.right);
            maxBottom = Math.max(maxBottom, bbox.bottom);
            found = true;
        }
    });

    if (!found) return null;

    return {
        top: minTop,
        left: minLeft,
        right: maxRight,
        bottom: maxBottom
    };
};

const isOverlapping = (a: BBox, b: BBox): boolean => {
    return !(
        a.left >= b.right ||
        a.right <= b.left ||
        a.top >= b.bottom ||
        a.bottom <= b.top
    );
};
