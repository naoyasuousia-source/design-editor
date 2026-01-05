/**
 * Logic/Services層: トリミングに関する純粋な計算と物理DOM操作を担当
 * rules.md に基づき、React のライフサイクルから独立して動作する。
 */

export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImageInfo {
    url: string;
    width: number;
    height: number;
}

export const imageCropService = {
    /**
     * 表示用の背景スタイルを計算する
     */
    calculateBackgroundStyles(params: {
        cropRect: CropRect;
        naturalSize: { width: number; height: number };
        elementSize: { width: number; height: number };
        url: string;
    }) {
        const { cropRect, naturalSize, elementSize, url } = params;
        const scale = elementSize.width / naturalSize.width;

        return {
            backgroundImage: `url("${url}")`,
            backgroundSize: `${naturalSize.width * scale}px ${naturalSize.height * scale}px`,
            backgroundPosition: `${-cropRect.x}px ${-cropRect.y}px`,
            backgroundRepeat: 'no-repeat',
            width: `${cropRect.width}px`,
            height: `${cropRect.height}px`
        };
    },

    /**
     * 確定時の物理DOM変換と最終的なスタイル文字列の生成
     */
    applyCropToElement(params: {
        target: HTMLElement;
        styles: any;
        initialOffsets: { offX: number; offY: number };
        cropRect: CropRect;
    }) {
        const { target, styles, initialOffsets, cropRect } = params;
        let finalTarget = target;

        // img を div に変換 (imgタグは背景画像を保持できないため)
        if (target.tagName.toLowerCase() === 'img') {
            const div = document.createElement('div');
            Array.from(target.attributes).forEach(attr => {
                if (attr.name !== 'src' && attr.name !== 'style') {
                    div.setAttribute(attr.name, attr.value);
                }
            });
            target.parentNode?.replaceChild(div, target);
            finalTarget = div;
        }

        // transform (位置) の計算
        const moveX = cropRect.x + initialOffsets.offX;
        const moveY = cropRect.y + initialOffsets.offY;

        const currentStyle = finalTarget.getAttribute('style') || '';
        let transStr = currentStyle.match(/transform:\s*([^;]+)/)?.[1] || finalTarget.style.transform || '';
        const tMatch = transStr.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);

        if (tMatch) {
            const bx = parseFloat(tMatch[1]);
            const by = parseFloat(tMatch[2]);
            transStr = transStr.replace(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/, `translate(${bx + moveX}px, ${by + moveY}px)`);
        } else {
            transStr = `${transStr} translate(${moveX}px, ${moveY}px)`.trim();
        }

        // スタイルの物理適用
        Object.assign(finalTarget.style, styles);
        finalTarget.style.transform = transStr;
        finalTarget.style.objectFit = '';
        finalTarget.style.objectPosition = '';

        return finalTarget;
    }
};
