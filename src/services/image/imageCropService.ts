import type { CropRect } from '@/utils/image/cropUtils';

/**
 * Action層: 命令的な DOM 操作（副作用）を担当。
 * 計算自体は utils/ から取得した結果を適用するのみとする。
 */
export const imageCropService = {
    /**
     * 既存の img 要素を div 要素に変換し、属性を引き継ぐ
     */
    convertImgToDiv(img: HTMLImageElement): HTMLDivElement {
        const div = document.createElement('div');
        Array.from(img.attributes).forEach(attr => {
            if (attr.name !== 'src' && attr.name !== 'style') {
                div.setAttribute(attr.name, attr.value);
            }
        });
        img.parentNode?.replaceChild(div, img);
        return div;
    },

    /**
     * トリミング結果を要素に適用する
     */
    applyFinalCrop(params: {
        target: HTMLElement;
        styles: any;
        initialOffsets: { offX: number; offY: number };
        cropRect: CropRect;
    }): HTMLElement {
        const { target, styles, initialOffsets, cropRect } = params;
        let finalTarget = target;

        // img を div に変換 (背景画像を持てるようにするため)
        if (target instanceof HTMLImageElement) {
            finalTarget = this.convertImgToDiv(target);
        }

        // transform (位置) の適用。既存の transform を維持しつつ移動分を加算。
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

        // 物理的なスタイルの適用
        Object.assign(finalTarget.style, styles);
        finalTarget.style.transform = transStr;
        finalTarget.style.objectFit = '';
        finalTarget.style.objectPosition = '';

        return finalTarget;
    },

    /**
     * Temporary UI の更新 (高頻度なドラッグ中の描画など)
     */
    updatePreview(params: {
        cropBox: HTMLElement;
        previewImg: HTMLImageElement;
        resizeHandle: HTMLElement;
        cropRect: CropRect;
        fullSize: { width: number; height: number };
        zoom: number;
    }) {
        const { cropBox, previewImg, resizeHandle, cropRect, fullSize, zoom } = params;

        // 枠の更新
        cropBox.style.left = `${cropRect.x * zoom}px`;
        cropBox.style.top = `${cropRect.y * zoom}px`;
        cropBox.style.width = `${cropRect.width * zoom}px`;
        cropBox.style.height = `${cropRect.height * zoom}px`;

        // プレビュー画像の更新（枠内での位置合わせ）
        previewImg.style.left = `${-cropRect.x * zoom}px`;
        previewImg.style.top = `${-cropRect.y * zoom}px`;
        previewImg.style.width = `${fullSize.width * zoom}px`;
        previewImg.style.height = `${fullSize.height * zoom}px`;

        // リサイズハンドルの更新
        resizeHandle.style.left = `${(cropRect.x + cropRect.width) * zoom - 12}px`;
        resizeHandle.style.top = `${(cropRect.y + cropRect.height) * zoom - 12}px`;
    }
};
