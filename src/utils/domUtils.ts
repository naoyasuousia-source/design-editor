export type TargetType = 'text' | 'image' | 'shape';

/**
 * HTMLElement の種類（テキスト、画像、図形）を判定する
 */
export const getTargetType = (el: HTMLElement | null): TargetType => {
    if (!el) return 'shape';
    const tagName = el.tagName.toLowerCase();

    // 画像判定 (imgタグ または background-image 持ち)
    const isImage = tagName === 'img' || (el.style.backgroundImage && el.style.backgroundImage.includes('url'));
    if (isImage) return 'image';

    // テキスト判定
    const textContent = el.textContent?.trim() || '';
    const isText = textContent !== '' &&
        (el.children.length === 0 ||
            Array.from(el.children).every(c =>
                ['br', 'span'].includes(c.tagName.toLowerCase()) ||
                (['div', 'p'].includes(c.tagName.toLowerCase()) && !c.id)
            ));

    return isText ? 'text' : 'shape';
};

/**
 * HTMLElement にスタイルを適用する（ベンダープレフィックス対応）
 */
export const applyElementStyle = (elements: HTMLElement[], property: string, value: string) => {
    elements.forEach(el => {
        let cssProperty = property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        if (cssProperty.startsWith('webkit-')) {
            cssProperty = `-${cssProperty}`;
        }
        el.style.setProperty(cssProperty, value);
    });
};
